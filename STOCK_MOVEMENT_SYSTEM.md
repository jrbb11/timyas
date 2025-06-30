# Stock Movement System Documentation

## Overview

The stock movement system in this inventory management application tracks all stock changes across warehouses through purchases, sales, and manual adjustments. The system maintains real-time stock levels and provides comprehensive audit trails.

## Database Schema

### Core Tables

#### 1. `warehouse_stock`
- **Purpose**: Tracks current stock levels for each product in each warehouse
- **Key Fields**: `warehouse_id`, `product_id`, `stock`
- **Primary Key**: Composite key of `warehouse_id` and `product_id`

#### 2. `products`
- **Purpose**: Product master data
- **Key Fields**: `id`, `name`, `code`, `product_cost`, `product_price`, `stock_alert`
- **Stock Alert**: Threshold for low stock notifications

#### 3. `warehouses`
- **Purpose**: Warehouse master data
- **Key Fields**: `id`, `name`, `code`, `address`

### Stock Movement Tables

#### 1. Purchase Flow
- **`purchases`**: Purchase orders with warehouse assignment
- **`purchase_items`**: Individual items in purchases
- **Trigger**: `handle_purchase_stock()` - Increases stock when purchase items are added

#### 2. Sale Flow
- **`sales`**: Sales orders with warehouse assignment
- **`sale_items`**: Individual items in sales
- **Trigger**: `fn_ws_on_sale_items()` - Decreases stock when sale items are added

#### 3. Adjustment Flow
- **`adjustment_batches`**: Batch of stock adjustments with reason and warehouse
- **`product_adjustments`**: Individual product adjustments within a batch
- **Trigger**: `fn_apply_adjustment_stock()` - Updates stock based on adjustment type

## Stock Movement Types

### 1. Purchase Stock Movement
```
Purchase Order Created → Purchase Items Added → Stock Increased
```

**Process**:
1. User creates purchase order with warehouse
2. User adds purchase items (products and quantities)
3. Trigger `handle_purchase_stock()` automatically increases warehouse stock
4. Stock is added to the specified warehouse

### 2. Sale Stock Movement
```
Sale Order Created → Sale Items Added → Stock Decreased
```

**Process**:
1. User creates sale order with warehouse
2. User adds sale items (products and quantities)
3. Trigger `fn_ws_on_sale_items()` automatically decreases warehouse stock
4. Stock is removed from the specified warehouse

### 3. Stock Adjustment Movement
```
Adjustment Batch Created → Product Adjustments Added → Stock Modified
```

**Process**:
1. User creates adjustment batch with reason and warehouse
2. User adds product adjustments (addition/subtraction)
3. Trigger `fn_apply_adjustment_stock()` automatically updates warehouse stock
4. Stock is increased (addition) or decreased (subtraction) based on type

## Database Functions

### Core Functions

#### 1. `handle_purchase_stock()`
- **Trigger**: After INSERT on `purchase_items`
- **Action**: Increases warehouse stock by purchase quantity
- **Logic**: 
  ```sql
  INSERT INTO warehouse_stock (warehouse_id, product_id, stock)
  SELECT p.warehouse, NEW.product_id, COALESCE(ws.stock, 0) + NEW.qty
  FROM purchases p
  LEFT JOIN warehouse_stock ws ON ws.warehouse_id = p.warehouse AND ws.product_id = NEW.product_id
  WHERE p.id = NEW.purchase_id
  ON CONFLICT (warehouse_id, product_id) DO UPDATE SET
      stock = warehouse_stock.stock + NEW.qty;
  ```

#### 2. `fn_ws_on_sale_items()`
- **Trigger**: After INSERT/DELETE/UPDATE on `sale_items`
- **Action**: Decreases warehouse stock on sale, increases on deletion
- **Logic**:
  - INSERT: Decrease stock by sale quantity
  - DELETE: Increase stock by sale quantity (reversal)
  - UPDATE: Adjust stock by quantity difference

#### 3. `fn_apply_adjustment_stock()`
- **Trigger**: After INSERT/DELETE/UPDATE on `product_adjustments`
- **Action**: Updates warehouse stock based on adjustment type
- **Logic**:
  - INSERT: Calculate new stock, update before/after values, update warehouse stock
  - DELETE: Reverse the adjustment
  - UPDATE: Reapply adjustment

### Utility Functions

#### 1. `generate_reference_for_table()`
- **Purpose**: Auto-generates reference codes for various tables
- **Tables**: products, purchases, sales, adjustment_batches
- **Format**: `PREFIX-000001` (e.g., PUR-000001, SAL-000001, ADJ-000001)

#### 2. `updated_at_timestamp()`
- **Purpose**: Updates timestamp when records are modified
- **Tables**: accounts, products

## Views

### `product_stock_view`
Aggregated stock view showing:
- Product information (name, code, cost, price)
- Total stock across all warehouses
- Stock status (In Stock, Low Stock, Out of Stock)
- Stock alert threshold

## Frontend Implementation

### Services Created

#### 1. `adjustmentBatchesService`
- CRUD operations for adjustment batches
- Includes related data (adjusted_by, warehouse)

#### 2. `productAdjustmentsService`
- CRUD operations for product adjustments
- Batch operations for multiple adjustments
- Includes related data (product, adjusted_by, adjustment_batch)

#### 3. `stockMovementService`
- Stock movement history queries
- Purchase movement queries
- Sale movement queries
- Current stock queries

### Pages Created

#### 1. `AllStockAdjustments.tsx`
- List all stock adjustment batches
- Search and filter functionality
- Pagination support
- Actions: View, Edit, Delete

#### 2. `CreateStockAdjustment.tsx`
- Create new stock adjustment batches
- Add multiple product adjustments
- Real-time stock level display
- Validation and error handling

#### 3. `StockAdjustmentView.tsx`
- Detailed view of adjustment batch
- List of all adjustments in the batch
- Summary statistics
- Before/after stock comparison

#### 4. `StockMovementHistory.tsx`
- Comprehensive stock movement history
- Filter by product, warehouse, date range, movement type
- Combined view of purchases, sales, and adjustments
- Detailed movement information

## Routes Added

```typescript
route("products/stock-adjustments", "pages/AllStockAdjustments.tsx"),
route("products/stock-adjustments/create", "pages/CreateStockAdjustment.tsx"),
route("products/stock-adjustments/edit/:id", "pages/CreateStockAdjustment.tsx"),
route("products/stock-adjustments/view/:id", "pages/StockAdjustmentView.tsx"),
route("products/stock-movement-history", "pages/StockMovementHistory.tsx"),
```

## Key Features

### 1. Real-time Stock Tracking
- Automatic stock updates on all transactions
- Multi-warehouse support
- Stock level validation

### 2. Comprehensive Audit Trail
- All stock movements are tracked
- Before/after stock levels for adjustments
- User attribution for all changes
- Timestamp tracking

### 3. Flexible Adjustment System
- Batch adjustments with reasons
- Addition and subtraction types
- Warehouse-specific adjustments
- Reference code generation

### 4. Stock Movement History
- Complete history of all stock changes
- Filterable by multiple criteria
- Visual indicators for movement types
- Detailed transaction information

### 5. Stock Alerts
- Low stock threshold monitoring
- Stock status indicators
- Out of stock detection

## Usage Examples

### Creating a Stock Adjustment
1. Navigate to Products > Stock Adjustments
2. Click "Create Adjustment"
3. Select warehouse and enter reason
4. Add products with adjustment type and quantity
5. Review before/after stock levels
6. Save adjustment batch

### Viewing Stock Movement History
1. Navigate to Products > Stock Movement History
2. Apply filters (product, warehouse, date range, movement type)
3. View comprehensive movement list
4. Analyze stock changes over time

### Monitoring Stock Levels
1. Use product_stock_view for current stock levels
2. Check stock status indicators
3. Monitor low stock alerts
4. Review movement history for specific products

## Database Setup

To set up the complete stock movement system:

1. Run the main database schema (`db.sql`)
2. Run the missing functions (`missing_functions.sql`)
3. Ensure all triggers are properly created
4. Verify the `product_stock_view` is created

## Security Considerations

- All stock movements are logged with user attribution
- Stock adjustments require reason documentation
- Reference codes prevent duplicate transactions
- Audit trail maintains data integrity

## Performance Considerations

- Indexes on frequently queried fields
- Efficient triggers for real-time updates
- Pagination for large datasets
- Optimized queries for stock movement history

This stock movement system provides a robust foundation for inventory management with comprehensive tracking, audit trails, and real-time updates across multiple warehouses. 