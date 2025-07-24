import urlJoin from "url-join";

export const apiUrl: string = urlJoin(import.meta.env.VITE_API_BASE_URL);
export const apiKey: string = import.meta.env.VITE_API_KEY;
export const apiBaseURL: string = urlJoin(
	import.meta.env.VITE_API_BASE_URL,
	"/api"
);
export const apiStaticURL = urlJoin(
	import.meta.env.VITE_API_BASE_URL,
	"/static"
);
