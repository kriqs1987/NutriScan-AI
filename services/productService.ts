
import { FoodItem } from '../types';

const STORAGE_KEY = 'nutriscan_product_database';

const DEFAULT_PRODUCTS: Omit<FoodItem, 'id'>[] = [
  { name: 'Pierś z kurczaka (gotowana)', calories: 165, protein: 31, carbs: 0, fats: 3.6, quantity: '100g' },
  { name: 'Ryż biały (gotowany)', calories: 130, protein: 2.7, carbs: 28, fats: 0.3, quantity: '100g' },
  { name: 'Jajko (rozmiar M)', calories: 70, protein: 6, carbs: 0.5, fats: 5, quantity: '1 szt.' },
  { name: 'Banan', calories: 89, protein: 1.1, carbs: 23, fats: 0.3, quantity: '1 szt.' },
  { name: 'Jabłko', calories: 52, protein: 0.3, carbs: 14, fats: 0.2, quantity: '100g' },
  { name: 'Skyr naturalny', calories: 63, protein: 11, carbs: 4, fats: 0, quantity: '150g' },
  { name: 'Chleb żytni', calories: 250, protein: 7, carbs: 48, fats: 3, quantity: '100g' },
];

export const productService = {
  getProducts(): Omit<FoodItem, 'id'>[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      return DEFAULT_PRODUCTS;
    }
    return JSON.parse(stored);
  },

  saveProduct(product: Omit<FoodItem, 'id'>): void {
    const products = this.getProducts();
    const index = products.findIndex(p => p.name.toLowerCase() === product.name.toLowerCase());
    
    if (index > -1) {
      products[index] = product;
    } else {
      products.push(product);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  },

  deleteProduct(name: string): void {
    const products = this.getProducts();
    const filtered = products.filter(p => p.name !== name);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
};
