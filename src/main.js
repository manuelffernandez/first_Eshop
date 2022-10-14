// ===============================================
// ==================== TAREA ====================
// ===============================================

// TODO: poner button de carrito en el navbar que invoque showPurchaseAlert()

// TODO: Chequear y cambiar nombres de funciones polémicas:
//		● moveProductStockFromThisTo()
//		● checkAndUpdate()

// TODO: modularizar código

// TODO: Dividir la funcionalidad de checkAddButton en: chequear stock en cart, manipular el dom.

import Item  from "./entities.js";
import getDatabaseProducts from "./services.js"
import { updateLocalStorageCart, getCartFromLocalStorage } from "./localStorage.js";
import ui from "./ui.js";
window.addOrRemoveFromCart = addOrRemoveFromCart;
window.eraseProductFromCart = eraseProductFromCart;







// ===============================================
// ==================== CLASS ====================
// ===============================================

class Storage extends Array {
	referenceProduct(IdProduct) {
		return this.find(product => product.id == IdProduct);
	}

	createProduct(product) {
		this.push(new Item(product.id, product.name, product.price, 1, product.desc, product.img));
	}

	moveProductStockFromThisTo(IdProduct, amount, storageToUpdate) {
		let product = this.referenceProduct(IdProduct);

		if(product.checkStock(amount)) {
			product.stock -= amount;

			if(storageToUpdate.referenceProduct(IdProduct) === undefined) {
				storageToUpdate.createProduct(product);
				storageToUpdate.referenceProduct(product.id).stock = amount;
				return
			}

			storageToUpdate.referenceProduct(product.id).stock += amount;
			return
		}
		ui.alertToastify(FRASE_STOCKUNAVAILABLE);
	}

	deleteProdWithNoStock() {
		this.forEach(product => {
			if(!product.stock) {
				let index = this.indexOf(product);
				this.splice(index, 1);
			}
		});
	}

	calcTotal() {
		let total = 0;

		this.forEach(product => total += product.calcSubtotal());
		return total;
	}
}









// ===================================================
// ==================== VARIABLES ====================
// ===================================================

//Referencias a los elementos del DOM
let shop = document.getElementById('shop');
let cartContainer = document.getElementById('cartContainer');

const FRASE_STOCKUNAVAILABLE = 'No hay más stock disponible';
const FRASE_IMPOSSIBLEREDUCE = 'No puede tener menos de un producto';

let databaseStore = [];

let store = new Storage();
let cart = new Storage();











// ===================================================
// ==================== FUNCIONES ====================
// ===================================================

function disableOrEnableAddBtn() {
	cart.forEach(product => {
		const {id, stock} = product;
		let button = document.querySelector(`#add-btn-${id}`);

		if(stock) {
			ui.changeButtonStyleToDisable(button);
			button.disabled = true;
		} else {
			ui.changeButtonStyleToEnable(button);
			button.disabled = false;
		}
	});
}

function refreshIndexDOM() {
	const cartTotal = cart.calcTotal();

	shop.innerHTML = '';
	ui.generateShop(store);

	cartContainer.innerHTML = '';
	cart.deleteProdWithNoStock();
	if(cartTotal) {
		ui.generateCart(cart, cartTotal);
	}

	disableOrEnableAddBtn();
}

function addOrRemoveFromCart(IdProduct, operator) {
	let operation = operator ? 1 : -1;
	let product = cart.referenceProduct(IdProduct);

	if(product){
		if(-product.stock === operation){
			ui.alertToastify(FRASE_IMPOSSIBLEREDUCE);
			return
		}
	}

	store.moveProductStockFromThisTo(IdProduct, operation, cart);
	updateLocalStorageCart(cart);
	refreshIndexDOM();
}

function eraseProductFromCart(IdProduct) {
	let amount = cart.referenceProduct(IdProduct).stock;

	cart.moveProductStockFromThisTo(IdProduct, amount, store);
	cart.deleteProdWithNoStock();
	updateLocalStorageCart(cart);
	refreshIndexDOM();
}

function checkAndUpdate() {
	const cartLS = getCartFromLocalStorage();

	if(cartLS) {
		cartLS.map(element => {
			store.moveProductStockFromThisTo(element.id, element.stock, cart);
		});
	}
}

function synchronizeStoreWithDatabaseStore() {
	databaseStore.forEach(product => {
		const {id, name, price, stock, desc, img} = product;
		let item = new Item(id,	name, price, stock, desc, img);

		store.push(item);
	});
}

async function updateLocalDatabaseStoreArray() {
    databaseStore = await getDatabaseProducts();
}

function init() {
	updateLocalDatabaseStoreArray()
		.then(() => {
			synchronizeStoreWithDatabaseStore();
			checkAndUpdate();
			refreshIndexDOM();
		})
		.catch(err => console.log(err))
}

init();
