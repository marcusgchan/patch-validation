import { UserService } from "./services/userService";
import { OrderService } from "./services/orderService";
import { ProductService } from "./services/productService";
import { logger } from "./utils/logger";
import { calculateTotal, formatCurrency } from "./utils/mathUtils";

async function main() {
  logger.info("Starting ts-orders application");

  const userService = new UserService();
  const productService = new ProductService();
  const orderService = new OrderService(userService, productService);

  // Create a user
  const user = await userService.createUser("John Doe", "john@example.com");
  logger.info(`Created user: ${user.name}`);

  // Create some products
  const product1 = await productService.createProduct("Laptop", 999.99);
  const product2 = await productService.createProduct("Mouse", 29.99);

  // Create an order
  const order = await orderService.createOrder(user.id, [
    product1.id,
    product2.id,
  ]);
  logger.info(`Created order: ${order.id}`);

  // Calculate total
  const total = calculateTotal([product1.price, product2.price]);
  logger.info(`Order total: ${formatCurrency(total)}`);
}

main().catch(console.error);
