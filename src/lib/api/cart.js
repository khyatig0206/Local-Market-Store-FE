function redirectToSignin() {
  if (typeof window !== 'undefined') {
    const current = window.location.href;
    try { localStorage.setItem('postLoginReturnTo', current); } catch {}
    window.location.href = '/signin';
  }
}

function savePostLoginAdd(productId, quantity) {
  if (typeof window === 'undefined') return;
  const payload = {
    type: 'addToCart',
    productId,
    quantity,
    returnTo: window.location.href,
    ts: Date.now(),
  };
  try { localStorage.setItem('postLoginAction', JSON.stringify(payload)); } catch {}
}

export async function addToCart(productId, quantity = 1) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
  if (!token) {
    savePostLoginAdd(productId, quantity);
    redirectToSignin();
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cart/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ productId, quantity })
  });
  if (res.status === 401) {
    savePostLoginAdd(productId, quantity);
    redirectToSignin();
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  if (!res.ok) {
    const err = new Error('Failed to add to cart');
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  try {
    // Signal item added for mini-cart toast
    const evt = new CustomEvent('cart:item-added', { detail: { productId, quantity } });
    window.dispatchEvent(evt);
  } catch {}
  return data;
}

export async function getCart() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
  if (!token) {
    redirectToSignin();
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cart`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (res.status === 401) {
    redirectToSignin();
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  if (!res.ok) {
    const err = new Error('Failed to fetch cart');
    err.status = res.status;
    throw err;
  }
  return await res.json();
}

export async function updateCartItem(productId, quantity) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
  if (!token) {
    redirectToSignin();
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cart/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ productId, quantity, replace: true })
  });
  if (res.status === 401) {
    redirectToSignin();
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  if (!res.ok) {
    const err = new Error('Failed to update cart item');
    err.status = res.status;
    throw err;
  }
  return await res.json();
}

export async function removeCartItem(productId) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
  if (!token) {
    redirectToSignin();
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cart/remove`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ productId })
  });
  if (res.status === 401) {
    redirectToSignin();
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  if (!res.ok) {
    const err = new Error('Failed to remove cart item');
    err.status = res.status;
    throw err;
  }
  return await res.json();
}
