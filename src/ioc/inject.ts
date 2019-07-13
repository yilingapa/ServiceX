import { interfaces, injectable, METADATA_KEY, inject, tagged } from 'inversify'
import { container, ScopeTypes, ScopeType } from './Container'
import { ConstructorOf } from '../types'
import { Service } from '../service'
import { ScopeSymbol, ScopeKeySymbol } from '../symbols'

export const Scope = (scope: ScopeType) => {
  return (target: any, key: string, index?: number) => {
    const defineKey = typeof index === 'number' ? `${index}` : key
    Reflect.defineMetadata(ScopeSymbol, scope, target.constructor, defineKey)
  }
}

export const getScope = (target: any, key: string, index?: number) => {
  const defineKey = typeof index === 'number' ? `${index}` : key
  if (Reflect.hasMetadata(ScopeSymbol, target.constructor, defineKey)) {
    return Reflect.getMetadata(ScopeSymbol, target.constructor, defineKey)
  }
  return ScopeTypes.Singleton
}

export const Injectable = <T extends ConstructorOf<Service<any>>>() => (target: T): any => {
  injectable()(target)
  const parameters = Reflect.getMetadata(METADATA_KEY.PARAM_TYPES, target)
  for (let index = 0; index < parameters.length; index++) {
    const parameter = parameters[index]
    if (parameter.prototype instanceof Service) {
      const scope = getScope(target, '', index)
      // inversify type bugs
      tagged(ScopeKeySymbol, scope)(target, undefined as any, index)
      container.register(parameter, scope)
    }
  }
}

export const Inject = <T extends interfaces.ServiceIdentifier<Service<any>>>(
  serviceIdentifier: T,
) => {
  return (target: any, key: string, index?: number) => {
    const scope = getScope(target, key, index)
    container.register(serviceIdentifier, scope)
    tagged(ScopeKeySymbol, scope)(target, key, index)
    inject(serviceIdentifier)(target, key, index)
  }
}

// lazyInject is evil!
// function lazyProxy(target: any, key: string, resolve: () => any, doCache: boolean) {
//   function getter(this: any) {
//     if (doCache && !Reflect.hasMetadata(InjectSymbol, this, key)) {
//       Reflect.defineMetadata(InjectSymbol, resolve(), this, key)
//     }
//     if (Reflect.hasMetadata(InjectSymbol, this, key)) {
//       return Reflect.getMetadata(InjectSymbol, this, key)
//     } else {
//       return resolve()
//     }
//   }

//   function setter(this: any, newVal: any) {
//     Reflect.defineMetadata(InjectSymbol, newVal, this, key)
//   }

//   Object.defineProperty(target, key, {
//     configurable: true,
//     enumerable: true,
//     get: getter,
//     set: setter,
//   })
// }
