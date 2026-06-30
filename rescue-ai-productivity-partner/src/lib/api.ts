import { auth } from '../firebase';

export async function customFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let uid = auth.currentUser?.uid;
  if (!uid) {
    const savedGuest = localStorage.getItem('rescue_ai_guest');
    if (savedGuest) {
      try {
        const parsed = JSON.parse(savedGuest);
        uid = parsed?.user?.uid;
      } catch(e) {}
    }
  }

  if (uid) {
    init = init || {};
    
    // Copy and prepare headers
    let headers: Record<string, string> = {};
    if (init.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        headers = { ...init.headers as Record<string, string> };
      }
    }
    
    headers['x-user-uid'] = uid;
    init.headers = headers;
  }
  return window.fetch(input, init);
}
