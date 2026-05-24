export interface FlowGameAuthOptions {
  getToken?: () => string | undefined
  getFxToken?: () => string | undefined
}

let getTokenImpl: () => string | undefined = () => undefined
let getFxTokenImpl: () => string | undefined = () => undefined

export function configureFlowGameAuth(options: FlowGameAuthOptions = {}) {
  if (options.getToken)
    getTokenImpl = options.getToken
  if (options.getFxToken)
    getFxTokenImpl = options.getFxToken
}

export function getToken(): string | undefined {
  return getTokenImpl()
}

export function getFxToken(): string | undefined {
  return getFxTokenImpl()
}
