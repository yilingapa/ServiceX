import {
  Service,
  ScopeTypes,
  Injectable,
  Reducer,
  container,
  ActionMethodOfService,
  Effect,
  EffectAction,
} from '../../src'
import { inject } from 'inversify'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

interface State {
  count: number
}

@Injectable(ScopeTypes.Transient)
class OtherModel extends Service<State> {
  defaultState = {
    count: -1,
  }
  @Reducer()
  subtract(state: State, n: number): State {
    return { ...state, count: state.count - n }
  }
}

@Injectable(ScopeTypes.Transient)
class CountModel extends Service<State> {
  defaultState = { count: 0 }

  @inject(OtherModel) other!: OtherModel

  // you can omit the inject decorator, if you are using constructor inject
  constructor(public other2: OtherModel) {
    super()
  }
  @Reducer()
  setCount(state: State, count: number): State {
    return { ...state, count }
  }

  @Reducer()
  syncCount(state: State): State {
    return { ...state, count: this.other.getState().count }
  }

  @Effect()
  proxySubtract(payload$: Observable<number>): Observable<EffectAction> {
    return payload$.pipe(map((n) => this.other2.getActions().subtract(n)))
  }
}

describe('Inject specs:', () => {
  let countModel: CountModel
  let actions: ActionMethodOfService<CountModel, State>

  beforeEach(() => {
    countModel = container.get(CountModel)
    actions = countModel.getActionMethods()
  })

  it('getState', () => {
    expect(countModel.getState()).toEqual({ count: 0 })
    actions.setCount(10)
    expect(countModel.getState()).toEqual({ count: 10 })
  })

  it('syncCount', () => {
    expect(countModel.getState()).toEqual({ count: 0 })
    actions.proxySubtract(1)
    expect(countModel.other2.getState()).toEqual({ count: -2 })
    actions.syncCount()
    expect(countModel.getState()).toEqual({ count: -1 })
  })
})