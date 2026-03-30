import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			refetchOnReconnect: true,
			retry: 1,
			staleTime: 5 * 60 * 1000,
			gcTime: 15 * 60 * 1000,
		},
		mutations: {
			retry: 0,
		},
	},
});
