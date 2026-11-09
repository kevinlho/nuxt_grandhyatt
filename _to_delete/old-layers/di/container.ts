import type { AxiosInstance } from 'axios'
import { LoginUseCase, LogoutUseCase } from '~/domain/usecases/auth'
import { UserUseCases } from '~/domain/usecases/user'
import { ProductUseCases } from '~/domain/usecases/product'
import { DummyAuthRepository } from '~/data/repositories/dummy/DummyAuthRepository'
import { DummyUserRepository } from '~/data/repositories/dummy/DummyUserRepository'
import { DummyProductRepository } from '~/data/repositories/dummy/DummyProductRepository'
import { ApiAuthRepository } from '~/data/repositories/api/ApiAuthRepository'
import { ApiUserRepository } from '~/data/repositories/api/ApiUserRepository'
import { ApiProductRepository } from '~/data/repositories/api/ApiProductRepository'

export function createContainer(http: AxiosInstance, useDummy: boolean) {
  const authRepo = useDummy ? new DummyAuthRepository() : new ApiAuthRepository(http)
  const userRepo = useDummy ? new DummyUserRepository() : new ApiUserRepository(http)
  const productRepo = useDummy ? new DummyProductRepository() : new ApiProductRepository(http)

  return {
    http,
    login: new LoginUseCase(authRepo),
    logout: new LogoutUseCase(authRepo),
    users: new UserUseCases(userRepo),
    products: new ProductUseCases(productRepo)
  }
}

export type Container = ReturnType<typeof createContainer>
