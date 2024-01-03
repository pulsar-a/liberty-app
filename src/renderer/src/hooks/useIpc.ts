import { AppRouter } from '@ipc-routes/routes'
import { createTRPCReact } from '@trpc/react-query'

const trpcReact = createTRPCReact<AppRouter>()

export const useIpc = () => {
  return {
    main: trpcReact,
  }
}
