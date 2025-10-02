import { logger } from "../utils/logger";
import { UserService } from "./userService";
import { ProductService } from "./productService";

export interface Order {
  id: string;
  userId: string;
  productIds: string[];
  createdAt: Date;
  status: "pending" | "completed" | "cancelled";
}

export class OrderService {
  private orders: Order[] = [];
  private nextId = 1;

  constructor(
    private userService: UserService,
    private productService: ProductService
  ) {}

  async createOrder(userId: string, productIds: string[]): Promise<Order> {
    // Verify user exists
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    // Verify products exist
    for (const productId of productIds) {
      const product = await this.productService.getProductById(productId);
      if (!product) {
        throw new Error(`Product with id ${productId} not found`);
      }
    }

    const order: Order = {
      id: `order_${this.nextId++}`,
      userId,
      productIds,
      createdAt: new Date(),
      status: "pending",
    };

    this.orders.push(order);
    logger.info(`Order created: ${order.id}`);

    return order;
  }

  async getOrderById(id: string): Promise<Order | null> {
    return this.orders.find((order) => order.id === id) || null;
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    return this.orders.filter((order) => order.userId === userId);
  }

  async updateOrderStatus(
    id: string,
    status: Order["status"]
  ): Promise<boolean> {
    const order = this.orders.find((order) => order.id === id);
    if (order) {
      order.status = status;
      logger.info(`Order ${id} status updated to ${status}`);
      return true;
    }
    return false;
  }

  // Unused function for validator to catch
  async cancelOrder(id: string): Promise<boolean> {
    return this.updateOrderStatus(id, "cancelled");
  }

  // Another unused function
  async getOrderHistory(): Promise<Order[]> {
    return this.orders.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
}
