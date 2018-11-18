const _ = undefined;
const basepath = `${window.location.origin}/api/v1`;
const successToast = 'toast--success';
const errorToast = 'toast--error';
const siteHeader = document.querySelector('#site-header');
const loginForm = document.querySelector('#login-form');
const createUserForm = document.querySelector('#create-user-form');
const createCategoryForm = document.querySelector('#create-category');
const createProductForm = document.querySelector('#create-new-product');
const logoutBtn = document.querySelector('#logout-btn');
const usersTableBody = document.querySelector('#users-table tbody');
const categoryTableBody = document.querySelector('#category-table tbody');
const productsTable = document.querySelector('#products-table');
const latestTableBody = document.querySelector('#lastest-sales tbody');
const recordSort = document.querySelector('.sort');
const filterRowsForm = document.querySelector('#filter-rows');
const filterQtyForm = document.querySelector('#filter-qty');
const clearFiltersProd = document.querySelector('#clear-product-filters');
const filterNameForm = document.querySelector('#filter-name');
const fromDate = document.querySelector('#from-date');
const toDate = document.querySelector('#to-date');
const productWrapper = document.querySelector('.products');
const cartCount = document.querySelector('.cart-count');
const cartTable = document.querySelector('#cart-table');
const salesTotalWrapper = document.querySelector('.total span');
const completeOrder = document.querySelector('#complete-order');
/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */

const processRequest = (url, method = 'GET', body = _) => {
  const token = localStorage.getItem('token');
  const options = {
    method,
    mode: 'cors',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  };

  return fetch(url, options)
    .then(async res => (res.ok ? res.json() : Promise.reject(await res.json())))
    .then(response => response)
    .catch(e => {
      const { message, error } = e;
      if (message === 'JsonWebTokenError') {
        localStorage.clear();
        window.location.replace('./');
      }
      return { message, error };
    });
};

const loadSpinner = () => {
  if (siteHeader.classList.contains('spinner')) {
    siteHeader.classList.remove('spinner');
    return;
  }
  siteHeader.classList.add('spinner');
};

const createNode = (element, className, content) => {
  const el = document.createElement(element);
  el.className = className;
  el.textContent = content;
  return el;
};

const append = (parent, el) => parent.appendChild(el);

const toast = (msg, className, delay = 4000) => {
  const errorParagraph = createNode('p', '', msg);
  const toastParent = createNode('div', 'toast');
  toastParent.appendChild(errorParagraph);
  toastParent.classList.add(className);
  const body = document.querySelector('body');
  body.insertBefore(toastParent, body.children[0]);
  setTimeout(() => {
    body.removeChild(toastParent);
  }, delay);
};

const formatCurrency = number =>
  new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2 }).format(number);

const nFormatter = num => {
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(2).replace(/\.0$/, '')}G+`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(2).replace(/\.0$/, '')}M+`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K+`;
  return num;
};

const formatDate = date =>
  new Date(date)
    .toJSON()
    .slice(0, 10)
    .split('-')
    .reverse()
    .join('/');

const populateAdminDashboard = async () => {
  loadSpinner();
  const miscUrl = `${basepath}/sales/?misc=true`;
  const response = await processRequest(miscUrl);
  const {
    totalproducts,
    totalcategory,
    totalemployee,
    totalproductsold,
    totalproductworth,
    totalsaleorder,
    latestsales
  } = response.misc;

  document.querySelector('#total-products').textContent = totalproducts;
  document.querySelector('#total-categories').textContent = totalcategory;
  document.querySelector('#total-staff').textContent = totalemployee;
  document.querySelector('#total-prod-sold').textContent = totalproductsold;
  document.querySelector('#total-sales-orders').textContent = totalsaleorder;
  document.querySelector('#total-prod-worth').textContent = `N ${nFormatter(totalproductworth)}`;
  while (latestTableBody.firstChild) latestTableBody.removeChild(latestTableBody.firstChild);
  toast('Dashboard Updated 🔥', successToast, 2000);

  if (!latestsales.length) {
    latestTableBody.insertAdjacentHTML('beforeend', `<tr><td colspan=6>No sale has been recorded yet. 😕</td></tr>`);
    loadSpinner();
    return;
  }
  latestsales.forEach(sale => {
    latestTableBody.insertAdjacentHTML(
      'beforeend',
      `<tr>
        <td colspan="1">${formatDate(sale.s_date)}</td>
        <td>${sale.s_description}</td>
        <td>${sale.s_qty}</td>
        <td>${formatCurrency(sale.s_price)}</td>
        <td class="total">${formatCurrency(sale.s_total)}</td>
      </tr>`
    );
  });

  loadSpinner();
};

const destroyInputErrors = formClass => {
  const form = document.querySelector(formClass);
  if (form.children[0].classList.contains('error__container')) {
    form.removeChild(form.children[0]);
  }
};

const destroyModal = e => {
  if (e.target.classList.contains('modal')) document.body.removeChild(e.target);
};

const handleInputErrors = (response, formClass) => {
  const ul = createNode('ul', 'error__container');
  const form = document.querySelector(formClass);
  destroyInputErrors(formClass);
  if (response.message) {
    const li = createNode('li', _, response.message);
    append(ul, li);
    form.insertBefore(ul, form.children[0]);
  } else {
    response.error.forEach(msg => {
      const li = createNode('li', _, msg);
      append(ul, li);
      form.insertBefore(ul, form.children[0]);
    });
  }
};

const redirectHandler = role => {
  if (role === 'Attendant') {
    localStorage.setItem('cart', '[]');
    window.location.replace('/make-sale.html');
  } else {
    window.location.replace('/admin.html');
  }
};

const generateDeleteModal = (e, entity) => {
  document.body.insertAdjacentHTML(
    'afterbegin',
    `<div class="modal">
      <div class="form-body">
        <h3>Do you want to delete this ${entity}?</h3>
        <button data-id=${e.target.parentElement.getAttribute('data-id')} id='confirm-delete'>Yes</button>
        <button id='cancel'>No</button>
      </div>
    </div>`
  );
};

/* User Settings */
const populateUserEditModal = response => {
  const { id, name, email } = response.data;
  let { role } = response.data;
  if (role === 'Owner') {
    role = `<option selected value="Owner">Owner</option>`;
  } else if (role === 'Admin') {
    role = `<option value="Attendant">Attendant</option> <option selected value="Admin">Admin</option>`;
  } else {
    role = `<option selected value="Attendant">Attendant</option> <option value="Admin">Admin</option>`;
  }
  document.body.insertAdjacentHTML(
    'afterbegin',
    `<div class="modal">
      <div class="form-body">
        <h3>Update User</h3><form id="update-user-form" data-id=${id}>
          <input type="text" id="update-name" placeholder="Employee Name" value='${name}'/>
          <input id="update-email" disabled value='${email}'/>
          <input type="password" id="update-password" placeholder="Password" />
          <select id="update-role">${role}</select>
          <input type="submit" value="Update User" /></form>
      </div>
    </div>`
  );
};

const userEditModal = async e => {
  const allUsersEndpoint = `${basepath}/users/?userid=${e.target.parentElement.getAttribute('data-id')}`;
  const response = await processRequest(allUsersEndpoint);
  populateUserEditModal(response);
  const modal = document.body.querySelector('.modal');
  modal.addEventListener('click', destroyModal);
  const updateForm = document.querySelector('#update-user-form');
  updateForm.addEventListener('submit', updateUser);
};

const userDeleteModal = async e => {
  generateDeleteModal(e, 'user');

  const modal = document.body.querySelector('.modal');
  modal.addEventListener('click', destroyModal);

  const delUserBtn = document.querySelector('#confirm-delete');
  const cancelBtn = document.querySelector('#cancel');

  delUserBtn.addEventListener('click', deleteUser);
  cancelBtn.addEventListener('click', () => document.body.removeChild(modal));
};

const populateUsersTable = async () => {
  loadSpinner();
  while (usersTableBody.firstChild) usersTableBody.removeChild(usersTableBody.firstChild);
  const response = await processRequest(`${basepath}/users/`);
  response.data.forEach(user => {
    usersTableBody.insertAdjacentHTML(
      'beforeend',
      `<tr>
          <td>${user.id}</td><td>${user.name}</td><td>${user.email}</td><td>${user.role}</td>
          <td data-id=${user.id} style="text-align: center">
            <button class="blue">Edit</button><button class="red">Delete</button>
          </td>
      </tr>`
    );
    const editBtn = usersTableBody.querySelectorAll('button.blue');
    editBtn.forEach(btn => btn.addEventListener('click', userEditModal));
    const delBtn = usersTableBody.querySelectorAll('button.red');
    delBtn.forEach(btn => btn.addEventListener('click', userDeleteModal));
  });
  loadSpinner();
  toast(response.message, successToast, 1000);
};

/* Category Settings */
const populateCategoryModal = response => {
  if (!response.data) {
    toast(response.message, errorToast);
    return;
  }
  const id = response.data.category_id;
  const name = response.data.category_name;
  document.body.insertAdjacentHTML(
    'afterbegin',
    `<div class="modal">
      <div class="form-body">
        <h3>Update Category</h3><form id="update-category-form" data-id=${id}>
          <input type="text" id="update-name" placeholder="Category Name" value='${name}'/>
          <input type="submit" value="Update Category" /></form>
      </div>
    </div>`
  );
};

const updateCategory = async e => {
  e.preventDefault();
  loadSpinner();
  const modal = document.body.querySelector('.modal');
  const uName = document.querySelector('#update-name').value;

  const categoryUpdateUrl = `${basepath}/category/${e.target.getAttribute('data-id')}`;
  const updateInfo = { name: uName };

  const updateResponse = await processRequest(categoryUpdateUrl, 'PUT', updateInfo);

  if (updateResponse.status === 'success') {
    loadSpinner();
    toast(updateResponse.message, successToast);
    document.body.removeChild(modal);
    populateCategoryTable();
    return;
  }
  loadSpinner();
  toast(updateResponse.message || updateResponse.error[0], errorToast);
};

const deleteCategory = async e => {
  const modal = document.body.querySelector('.modal');
  const categoryId = Number(e.target.getAttribute('data-id'));
  const deleteCategoryUrl = `${basepath}/category/${categoryId}`;
  const deleteResponse = await processRequest(deleteCategoryUrl, 'DELETE');

  if (!deleteResponse.status) {
    toast(deleteResponse.message, errorToast);
    document.body.removeChild(modal);
    return;
  }

  toast('Category deleted successfully', successToast);
  document.body.removeChild(modal);
  populateCategoryTable();
};

const categoryDeleteModal = async e => {
  generateDeleteModal(e, 'category');

  const modal = document.body.querySelector('.modal');
  modal.addEventListener('click', destroyModal);

  const delUserBtn = document.querySelector('#confirm-delete');
  const cancelBtn = document.querySelector('#cancel');

  delUserBtn.addEventListener('click', deleteCategory);
  cancelBtn.addEventListener('click', () => document.body.removeChild(modal));
};

const categoryEditModal = async e => {
  const singleCategoryUrl = `${basepath}/category/${e.target.parentElement.getAttribute('data-id')}`;
  const response = await processRequest(singleCategoryUrl);

  populateCategoryModal(response);
  const modal = document.body.querySelector('.modal');
  modal.addEventListener('click', destroyModal);
  const updateForm = document.querySelector('#update-category-form');
  updateForm.addEventListener('submit', updateCategory);
};

const populateCategoryTable = async () => {
  loadSpinner();
  const response = await processRequest(`${basepath}/category/`);
  while (categoryTableBody.firstChild) categoryTableBody.removeChild(categoryTableBody.firstChild);
  if (!response.data.length) {
    loadSpinner();
    categoryTableBody.insertAdjacentHTML(
      'beforeend',
      `<tr><td colspan=3>You have not created a category yet. 😕</td></tr>`
    );
    return;
  }
  response.data.forEach(category => {
    categoryTableBody.insertAdjacentHTML(
      'beforeend',
      `<tr><td>${category.category_id}</td><td>${category.category_name}</td>
          <td data-id=${category.category_id} style="text-align: center">
          <button class="blue">Edit</button><button class="red">Delete</button>
        </td>
      </tr>`
    );
    const editBtn = categoryTableBody.querySelectorAll('button.blue');
    editBtn.forEach(btn => btn.addEventListener('click', categoryEditModal));
    const delBtn = categoryTableBody.querySelectorAll('button.red');
    delBtn.forEach(btn => btn.addEventListener('click', categoryDeleteModal));
  });
  loadSpinner();
  toast(response.message, successToast, 1000);
};

const populateCategoryDropDown = async () => {
  const categoryDropDown = document.querySelector('#product-cat');
  const response = await processRequest(`${basepath}/category/`);
  response.data.forEach(category => {
    categoryDropDown.insertAdjacentHTML(
      'beforeend',
      `<option value=${category.category_id}>${category.category_name}</option>`
    );
  });
};

/* Pagination  */
const goToPage = async (element, page, limit = 10, query = _) => {
  loadSpinner();
  const queryString = `${basepath}/products/?page=${page}&limit=${limit}&${query}`;
  const paginationResponse = await processRequest(queryString);
  while (element.firstChild) element.removeChild(element.firstChild);
  paginationResponse.data.forEach(product => generateTableBodyEntries(element, product));
  loadSpinner();
  paginationComponent(element, paginationResponse, limit, query);
};

const paginationComponent = (element, response, limit, query) => {
  const paginationEl = document.querySelector('.pagination');
  if (paginationEl) {
    paginationEl.remove();
  }
  const { hasPrevPage, hasNextPage, nextPage, prevPage } = response.meta;
  const prev = hasPrevPage
    ? `<button class="pagination__prev">⬅ Previous Page</button>`
    : `<button disabled class="pagination__prev">⬅ Previous Page</button>`;
  const next = hasNextPage
    ? `<button class="pagination__next">Next Page ➡</button>`
    : `<button disabled class="pagination__next">Next Page ➡</button>`;
  element.parentElement.parentElement.insertAdjacentHTML(
    'beforeend',
    `<section class="pagination">${prev}${next}</section>`
  );
  const nextPageBtn = document.querySelector('.pagination__next');
  const prevPageBtn = document.querySelector('.pagination__prev');
  nextPageBtn.addEventListener('click', () => goToPage(element, nextPage, limit, query));
  prevPageBtn.addEventListener('click', () => goToPage(element, prevPage, limit, query));
};

/* Products Settings */
const populateProductsModal = async response => {
  if (!response.data) {
    toast(response.message, errorToast);
    return;
  }
  const id = response.data.product_id;
  const image = response.data.product_image;
  const name = response.data.product_name;
  const price = response.data.product_price;
  const qty = response.data.product_qty;
  const categoryId = response.data.category_id;
  const catInfo = await processRequest(`${basepath}/category/${categoryId}`);
  const selectedCategory = catInfo.data
    ? `<option selected value="${catInfo.data.category_id}">${catInfo.data.category_name}</option>`
    : `<option selected disabled value="Not Set">Select Category</option>`;
  document.body.insertAdjacentHTML(
    'afterbegin',
    `<div class="modal"><div class="form-body"><h3>Update Product Details</h3><form id="update-product-form" data-id=${id}>
      <input type="text" id="update-image" placeholder="Image Url" value='${image}'/><input type="text" id="update-name" placeholder="Product Name" value='${name}'/>
      <input type="text" id="update-price" placeholder="Product Price" value='${price}'/><input type="text" id="update-qty" placeholder="Product Quantity" value='${qty}'/>
      <select id="product-cat" required>${selectedCategory}<option disabled>----</option></select><input type="submit" value="Update Category" /></form></div>
    </div>`
  );
  populateCategoryDropDown();
};

const updateProduct = async e => {
  e.preventDefault();
  loadSpinner();
  const modal = document.body.querySelector('.modal');
  const uImage = document.querySelector('#update-image').value;
  const uName = document.querySelector('#update-name').value;
  const uPrice = document.querySelector('#update-price').value;
  const uQty = document.querySelector('#update-qty').value;
  const uCategory = document.querySelector('#product-cat').value;

  if (Number.isNaN(Number(uCategory))) {
    loadSpinner();
    toast('Select a category', errorToast);
    return;
  }

  const categoryUpdateUrl = `${basepath}/products/${e.target.getAttribute('data-id')}`;
  const updateInfo = { imgUrl: uImage, name: uName, price: uPrice, qty: uQty, categoryid: uCategory };

  const updateResponse = await processRequest(categoryUpdateUrl, 'PUT', updateInfo);

  if (updateResponse.status === 'success') {
    loadSpinner();
    toast(updateResponse.message, successToast, 1000);
    document.body.removeChild(modal);
    populateProductsTable();
    return;
  }
  loadSpinner();
  toast(updateResponse.message || updateResponse.error, errorToast);
};

const deleteProduct = async e => {
  loadSpinner();
  const modal = document.body.querySelector('.modal');
  const productId = Number(e.target.getAttribute('data-id'));
  const query = `${basepath}/products/${productId}`;
  const deleteResponse = await processRequest(query, 'DELETE');

  if (!deleteResponse.status) {
    loadSpinner();
    toast(deleteResponse.message, errorToast);
    document.body.removeChild(modal);
    return;
  }

  toast('Product deleted successfully', successToast, 1000);
  document.body.removeChild(modal);
  loadSpinner();
  populateProductsTable();
  const paginationEl = document.querySelector('.pagination');
  if (paginationEl) {
    paginationEl.remove();
  }
};

const productEditModal = async e => {
  const singleCategoryUrl = `${basepath}/products/${e.target.parentElement.getAttribute('data-id')}`;
  const response = await processRequest(singleCategoryUrl);

  await populateProductsModal(response);
  const modal = document.body.querySelector('.modal');
  modal.addEventListener('click', destroyModal);
  const updateForm = document.querySelector('#update-product-form');
  updateForm.addEventListener('submit', updateProduct);
};

const productDeleteModal = async e => {
  generateDeleteModal(e, 'product');

  const modal = document.body.querySelector('.modal');
  modal.addEventListener('click', destroyModal);

  const delUserBtn = document.querySelector('#confirm-delete');
  const cancelBtn = document.querySelector('#cancel');

  delUserBtn.addEventListener('click', deleteProduct);
  cancelBtn.addEventListener('click', () => document.body.removeChild(modal));
};

const generateTableBodyEntries = (element, entity) => {
  element.insertAdjacentHTML(
    'beforeend',
    `<tr>
      <td>${entity.product_id}</td>
      <td>${entity.product_name}</td>
      <td>N ${formatCurrency(entity.product_price)}</td>
      <td>${entity.product_qty}</td>
      <td data-id=${entity.product_id} style="text-align: center">
        <button class="blue">Edit</button><button class="red">Delete</button>
      </td>
    </tr>`
  );
  const editBtn = element.querySelectorAll('button.blue');
  editBtn.forEach(btn => btn.addEventListener('click', productEditModal));
  const delBtn = element.querySelectorAll('button.red');
  delBtn.forEach(btn => btn.addEventListener('click', productDeleteModal));
};

const populateProductsTable = async () => {
  loadSpinner();
  const endPoint = `${basepath}/products/`;
  const response = await processRequest(endPoint);
  const tableBody = productsTable.children[1];

  while (tableBody.firstChild) tableBody.removeChild(tableBody.firstChild);

  if (!response.data.length) {
    loadSpinner();
    recordSort.style.display = 'none';
    tableBody.insertAdjacentHTML('beforeend', `<tr><td colspan=5>${response.message}</td></tr>`);
    return;
  }

  loadSpinner();
  recordSort.style.display = 'block';
  response.data.forEach(product => generateTableBodyEntries(tableBody, product));
  paginationComponent(tableBody, response);
  toast(response.message, successToast, 1000);
};

/* Product Cards */
const generateProductsCard = (element, entity) => {
  const inStock = entity.product_qty ? 'in-stock' : 'out-stock';
  const cartBtn = entity.product_qty
    ? `<button id="#add-to-cart" data-id=${entity.product_id} class="product__addCart">Add to Cart</button>`
    : '<button disabled class="product__addCart">Out of Stock</button>';
  element.insertAdjacentHTML(
    'beforeend',
    `<div class="product ${inStock}">
      <img class="product__image" src="./img/phone.jpg" alt="product-image"/>
      <div class="product__details">
        <a class="product__name" href="./view-product.html">${entity.product_name}</a>
        <p class="product__price"><span class="currency">₦</span>${formatCurrency(entity.product_price)}</p>
        <div class="product__stkInfo">
          <p class="product__cat">${entity.category_name}</p>
          <p class="product__stock">${entity.product_qty}</p>
        </div>
        <div  class="amt"><input class="product__qty" type="number" value="1" min="1" max="${
          entity.product_qty
        }"/></div>
      </div>
      ${cartBtn}
      </div>`
  );
};

const addToCart = async (e, allowedQty, requestedQty) => {
  const productId = Number(e.target.getAttribute('data-id'));
  const productQty = Number(requestedQty.value);
  if (!productQty || productQty === 0 || productQty > allowedQty) {
    toast('Requested quantity is not allowed', errorToast, 2000);
    return;
  }
  const endPoint = `${basepath}/products/${productId}`;
  const response = await processRequest(endPoint);
  const productEntry = {
    id: productId,
    qty: productQty,
    name: response.data.product_name,
    price: response.data.product_price,
    total: productQty * response.data.product_price
  };
  const cartItems = JSON.parse(localStorage.getItem('cart'));
  const thisProduct = cartItems.find(product => product.id === productId);
  if (!thisProduct) {
    cartItems.push(productEntry);
  } else {
    thisProduct.qty = productQty;
  }
  toast('Added to cart.', successToast, 1000);
  const updatedCart = JSON.stringify(cartItems);
  localStorage.setItem('cart', updatedCart);
  cartCount.textContent = cartItems.length;
};

const bindEventToCartBtn = element => {
  Array.from(element.children).forEach(productCard => {
    const addToCartBtn = productCard.querySelector('.product__addCart');
    const allowedQty = Number(productCard.querySelector('.product__stock').textContent);
    const requestedQty = productCard.querySelector('.product__qty');
    addToCartBtn.addEventListener('click', e => addToCart(e, allowedQty, requestedQty));
  });
};

const cardsPaginationComponent = (wrapperEl, response) => {
  const paginationEl = document.querySelector('.pagination');
  if (paginationEl) paginationEl.remove();
  const { hasPrevPage, hasNextPage, nextPage, prevPage } = response.meta;
  const prev = hasPrevPage
    ? `<button class="pagination__prev">⬅ Previous Page</button>`
    : `<button disabled class="pagination__prev">⬅ Previous Page</button>`;
  const next = hasNextPage
    ? `<button class="pagination__next">Next Page ➡</button>`
    : `<button disabled class="pagination__next">Next Page ➡</button>`;
  productWrapper.firstChild.parentElement.parentElement.insertAdjacentHTML(
    'beforeend',
    `<section class="pagination">${prev}${next}</section>`
  );
  const nextPageBtn = document.querySelector('.pagination__next');
  const prevPageBtn = document.querySelector('.pagination__prev');
  nextPageBtn.addEventListener('click', async () => {
    loadSpinner();
    const queryString = `${basepath}/products/?limit=12&page=${nextPage}`;
    const paginationResponse = await processRequest(queryString);
    while (productWrapper.firstChild) productWrapper.removeChild(productWrapper.firstChild);
    paginationResponse.data.forEach(product => generateProductsCard(productWrapper, product));
    loadSpinner();
    cardsPaginationComponent(wrapperEl, paginationResponse);
  });
  prevPageBtn.addEventListener('click', async () => {
    loadSpinner();
    const queryString = `${basepath}/products/?limit=12&page=${prevPage}`;
    const paginationResponse = await processRequest(queryString);
    while (productWrapper.firstChild) productWrapper.removeChild(productWrapper.firstChild);
    paginationResponse.data.forEach(product => generateProductsCard(productWrapper, product));
    loadSpinner();
    cardsPaginationComponent(wrapperEl, paginationResponse);
  });
};

const populateMakeSaleCards = async () => {
  if (!localStorage.getItem('cart')) localStorage.setItem('cart', '[]');
  cartCount.textContent = JSON.parse(localStorage.getItem('cart')).length;
  loadSpinner();
  const endPoint = `${basepath}/products/?limit=12`;
  const response = await processRequest(endPoint);
  const noResultText = `<h3 class="no-result">No products found. 😌</h3>`;
  while (productWrapper.firstChild) productWrapper.removeChild(productWrapper.firstChild);
  if (!response.data.length) {
    loadSpinner();
    productWrapper.parentElement.parentElement.insertAdjacentHTML('beforeend', noResultText);
    productWrapper.parentElement.remove();
    return;
  }

  response.data.forEach(product => generateProductsCard(productWrapper, product));
  bindEventToCartBtn(productWrapper);
  cardsPaginationComponent(productWrapper, response);
  loadSpinner();
};

/* Cart */
const updateCartCount = () => {
  cartCount.textContent = JSON.parse(localStorage.getItem('cart')).length;
};

const generateCartEntries = async (element, item) => {
  element.insertAdjacentHTML(
    'beforeend',
    `<tr data-id=${item.id}>
        <td><span class="remove">-</span></td>
        <td>${item.name}</td>
        <td>${item.qty}</td>
        <td>${formatCurrency(item.price)}</td>
        <td class="total">${formatCurrency(item.total)}</td>
      </tr>`
  );
};

const populateCart = () => {
  loadSpinner();
  const cartItems = JSON.parse(localStorage.getItem('cart'));
  const tableBody = cartTable.children[1];
  while (tableBody.firstChild) tableBody.removeChild(tableBody.firstChild);
  cartItems.forEach(async item => generateCartEntries(tableBody, item));
  const total = cartItems.map(item => item.total).reduce((acc, curr) => acc + curr, 0);
  salesTotalWrapper.textContent = formatCurrency(total);
  Array.from(tableBody.children).forEach(row => {
    const removeBtn = row.querySelector('.remove');
    removeBtn.addEventListener('click', () => {
      const rowId = Number(row.dataset.id);
      const thisProduct = cartItems.find(product => product.id === rowId);
      if (thisProduct) {
        cartItems.splice(cartItems.indexOf(thisProduct), 1);
        const updatedCart = JSON.stringify(cartItems);
        localStorage.setItem('cart', updatedCart);
        row.remove();
        populateCart();
      }
    });
  });
  loadSpinner();
  if (!tableBody.children.length) {
    completeOrder.style.display = 'none';
    return;
  }
  completeOrder.style.display = 'block';
};

/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */

const login = async e => {
  e.preventDefault();
  const loginBtn = document.querySelector(`.${e.target.className} .btn`);
  loginBtn.textContent = 'Authenticating';
  loadSpinner();
  const email = document.querySelector('#login-email').value;
  const password = document.querySelector('#login-password').value;
  const loginUrl = `${basepath}/auth/login`;
  const loginInfo = { email, password };
  const response = await processRequest(loginUrl, 'POST', loginInfo);
  destroyInputErrors('.form__login');
  if (!response.data) {
    loginBtn.textContent = 'Login';
    loadSpinner();
    if (response.message) {
      handleInputErrors(response, '.form__login');
      return;
    }
    handleInputErrors(response, '.form__login');
    return;
  }
  loginBtn.textContent = 'Successful ✅';
  const { token, role } = response.data;
  localStorage.setItem('token', token);
  localStorage.setItem('role', role);
  toast(response.message, successToast, 2000);
  redirectHandler(role);
};

const createUser = async e => {
  e.preventDefault();
  loadSpinner();
  const name = document.querySelector('#staff-name').value;
  const email = document.querySelector('#staff-email').value;
  const password = document.querySelector('#staff-password').value;
  const role = document.querySelector('#staff-role').value;
  const signupUrl = `${basepath}/auth/signup`;
  const signupInfo = { name, email, password, role };
  const response = await processRequest(signupUrl, 'POST', signupInfo);
  destroyInputErrors('#create-user-form');
  if (!response.data) {
    loadSpinner();
    handleInputErrors(response, '#create-user-form');
    return;
  }
  loadSpinner();
  toast(response.message, successToast, 1000);
  createUserForm.reset();
  populateUsersTable();
};

const updateUser = async e => {
  e.preventDefault();
  loadSpinner();
  const modal = document.body.querySelector('.modal');
  const uName = document.querySelector('#update-name').value;
  const uEmail = document.querySelector('#update-email').value;
  const uRole = document.querySelector('#update-role').value;
  let uPassword = document.querySelector('#update-password').value;
  uPassword = uPassword.length < 5 ? undefined : document.querySelector('#update-password').value;
  const userUpdateUrl = `${basepath}/users/${e.target.getAttribute('data-id')}`;
  const updateInfo = { name: uName, email: uEmail, password: uPassword, role: uRole };
  if (!uPassword) delete updateInfo.password;
  if (uRole === 'Owner') delete updateInfo.role;
  const updateResponse = await processRequest(userUpdateUrl, 'PUT', updateInfo);
  if (updateResponse.status === 'success') {
    loadSpinner();
    toast(updateResponse.message, successToast, 800);
    document.body.removeChild(modal);
    populateUsersTable();
    return;
  }
  loadSpinner();
  toast(updateResponse.message || updateResponse.error[0], errorToast, 800);
  document.body.removeChild(modal);
};

const deleteUser = async e => {
  loadSpinner();
  const modal = document.body.querySelector('.modal');
  const userid = Number(e.target.getAttribute('data-id'));
  const deleteUsersEndpoint = `${basepath}/users/${userid}`;
  const deleteResponse = await processRequest(deleteUsersEndpoint, 'DELETE');
  if (!deleteResponse.status) {
    loadSpinner();
    toast(deleteResponse.message, errorToast, 800);
    document.body.removeChild(modal);
    return;
  }
  loadSpinner();
  toast(deleteResponse.message, successToast, 800);
  document.body.removeChild(modal);
  populateUsersTable();
};

const createCategory = async e => {
  loadSpinner();
  e.preventDefault();
  const categoryName = document.querySelector('#category-name').value;
  const categoryEnpoint = `${basepath}/category`;
  const categoryInfo = { name: categoryName };
  const response = await processRequest(categoryEnpoint, 'POST', categoryInfo);
  destroyInputErrors('#create-category');
  if (!response.data) {
    loadSpinner();
    toast(response.message, errorToast);
    return;
  }
  loadSpinner();
  createCategoryForm.reset();
  toast(response.message, successToast);
  populateCategoryTable();
};

const createProduct = async e => {
  loadSpinner();
  e.preventDefault();
  const imgUrl = document.querySelector('#product-imgurl').value;
  const name = document.querySelector('#product-name').value;
  const price = document.querySelector('#product-price').value;
  const qty = document.querySelector('#product-qty').value;
  const categoryid = document.querySelector('#product-cat').value;
  if (!Number(categoryid)) {
    loadSpinner();
    toast('Please select a category', errorToast, 700);
    return;
  }
  const productInfo = { imgUrl, name, categoryid, price, qty };
  const productUrl = `${basepath}/products`;
  const response = await processRequest(productUrl, 'POST', productInfo);
  if (!response.data) {
    loadSpinner();
    handleInputErrors(response, '#create-new-product');
    return;
  }
  destroyInputErrors('#create-new-product');
  createProductForm.reset();
  loadSpinner();
  toast(response.message, successToast, 700);
  populateProductsTable();
};

const createNewSale = async () => {
  loadSpinner();
  const cartItems = JSON.parse(localStorage.getItem('cart'));
  const endPointUrl = `${basepath}/sales`;
  const saleInfo = { products: cartItems };
  const response = await processRequest(endPointUrl, 'POST', saleInfo);
  if (!response.data) {
    loadSpinner();
    toast(response.message, errorToast);
    return;
  }
  loadSpinner();
  toast(response.message, successToast);
  localStorage.setItem('cart', '[]');
  /* TODO: Show a Div with checkout complete for some seconds then show empty cart div */
  populateCart();
};

const filterByRows = async e => {
  loadSpinner();
  e.preventDefault();
  const tableBody = productsTable.children[1];
  const limit = document.querySelector('#filter-pref').value;
  const filterQuery = `${basepath}/products/?limit=${limit}`;
  const response = await processRequest(filterQuery);
  while (tableBody.firstChild) tableBody.removeChild(tableBody.firstChild);
  response.data.forEach(product => generateTableBodyEntries(tableBody, product));
  paginationComponent(tableBody, response, limit);
  loadSpinner();
  toast(response.message, successToast, 1000);
};

const filterByName = async e => {
  loadSpinner();
  e.preventDefault();
  const tableBody = productsTable.children[1];
  const searchText = document.querySelector('#search-name').value;
  const filterQuery = `${basepath}/products/?search=${searchText}`;

  const response = await processRequest(filterQuery);
  while (tableBody.firstChild) tableBody.removeChild(tableBody.firstChild);

  if (!response.data.length) {
    loadSpinner();
    tableBody.insertAdjacentHTML('beforeend', `<tr><td colspan=5>${response.message}</td></tr>`);
    paginationComponent(tableBody, response, 10);
    return;
  }

  loadSpinner();
  response.data.forEach(product => generateTableBodyEntries(tableBody, product));
  toast(response.message, successToast, 1000);
  paginationComponent(tableBody, response, 10);
};

const filterByQty = async e => {
  e.preventDefault();
  const tableBody = productsTable.children[1];
  loadSpinner();
  const qty = document.querySelector('#qty-pref').value;
  const filterQuery = `${basepath}/products/?stock=${qty}`;
  const response = await processRequest(filterQuery);
  while (tableBody.firstChild) tableBody.removeChild(tableBody.firstChild);
  if (!response.data.length) {
    loadSpinner();
    tableBody.insertAdjacentHTML('beforeend', `<tr><td colspan=5>${response.message}</td></tr>`);
    return;
  }
  loadSpinner();
  response.data.forEach(product => generateTableBodyEntries(tableBody, product));
  paginationComponent(tableBody, response, 10, `stock=${qty}`);
  toast(response.message, successToast, 1000);
};

const clearProductFilers = () => {
  toast('Filters cleared', successToast, 200);
  filterRowsForm.reset();
  filterQtyForm.reset();
  filterNameForm.reset();
  populateProductsTable();
};

if (loginForm) loginForm.addEventListener('submit', login);
if (createUserForm) createUserForm.addEventListener('submit', createUser);
if (createCategoryForm) createCategoryForm.addEventListener('submit', createCategory);
if (createProductForm) createProductForm.addEventListener('submit', createProduct);
if (completeOrder) completeOrder.addEventListener('click', createNewSale);
if (filterRowsForm) filterRowsForm.addEventListener('submit', filterByRows);
if (filterQtyForm) filterQtyForm.addEventListener('submit', filterByQty);
if (filterNameForm) filterNameForm.addEventListener('submit', filterByName);
if (clearFiltersProd) clearFiltersProd.addEventListener('click', clearProductFilers);
if (fromDate && toDate) {
  const date = new Date();
  let day = date.getDate();
  let month = date.getMonth() + 1;
  const year = date.getFullYear();
  month = (month < 10 ? '0' : '') + month;
  day = (day < 10 ? '0' : '') + day;
  const today = `${year}-${month}-${day}`;
  fromDate.value = today;
  toDate.value = today;
}
if (logoutBtn) {
  logoutBtn.addEventListener('click', e => {
    e.preventDefault();
    localStorage.clear();
    window.location.replace('./');
  });
}

switch (window.location.pathname) {
  case '/admin.html':
    populateAdminDashboard();
    break;
  case '/product-settings.html':
    populateCategoryDropDown();
    populateProductsTable();
    break;
  case '/category-settings.html':
    populateCategoryTable();
    break;
  case '/sale-records.html':
    break;
  case '/staff-accounts.html':
    populateUsersTable();
    break;
  case '/make-sale.html':
    populateCategoryDropDown();
    populateMakeSaleCards();
    break;
  case '/cart.html':
    populateCart();
    break;
  case '/my-sales.html':
    updateCartCount();
    break;
  case '/view-product.html':
    break;
  default:
    break;
}
