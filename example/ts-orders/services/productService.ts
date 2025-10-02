import { logger } from "../utils/logger";

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  createdAt: Date;
}

export class ProductService {
  private products: Product[] = [];
  private nextId = 1;

  async createProduct(
    name: string,
    price: number,
    description?: string
  ): Promise<Product> {
    const product: Product = {
      id: `product_${this.nextId++}`,
      name,
      price,
      description,
      createdAt: new Date(),
    };

    this.products.push(product);
    logger.info(`Product created: ${product.id} - ${product.name}`);

    return product;
  }

  async getProductById(id: string): Promise<Product | null> {
    return this.products.find((product) => product.id === id) || null;
  }

  async getAllProducts(): Promise<Product[]> {
    return [...this.products];
  }

  async getProductsByPriceRange(
    minPrice: number,
    maxPrice: number
  ): Promise<Product[]> {
    return this.products.filter(
      (product) => product.price >= minPrice && product.price <= maxPrice
    );
  }

  // Unused function for validator to catch
  async updateProductPrice(id: string, newPrice: number): Promise<boolean> {
    const product = this.products.find((product) => product.id === id);
    if (product) {
      product.price = newPrice;
      logger.info(`Product ${id} price updated to ${newPrice}`);
      return true;
    }
    return false;
  }

  // Another unused function
  async deleteProduct(id: string): Promise<boolean> {
    const index = this.products.findIndex((product) => product.id === id);
    if (index !== -1) {
      this.products.splice(index, 1);
      logger.info(`Product ${id} deleted`);
      return true;
    }
    return false;
  }

  // Yet another unused function
  async searchProducts(query: string): Promise<Product[]> {
    const lowercaseQuery = query.toLowerCase();
    return this.products.filter(
      (product) =>
        product.name.toLowerCase().includes(lowercaseQuery) ||
        product.description?.toLowerCase().includes(lowercaseQuery)
    );
  }
}
