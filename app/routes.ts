import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("pages/Login.tsx"),
  route("dashboard", "pages/Dashboard.tsx"),
  route("products/create", "pages/CreateProduct.tsx"),
  route("products/edit/:id", "pages/EditProduct.tsx"),
  route("products/all", "pages/AllProducts.tsx"),
  route("products/category", "pages/Category.tsx"),
  route("products/brand", "pages/Brand.tsx"),
  route("products/unit", "pages/Unit.tsx"),
  route("products/count-stock", "pages/CountStock.tsx"),
  route("sales/create", "pages/CreateSale.tsx"),
  route("sales/all", "pages/AllSales.tsx"),
  route("sales/shipments", "pages/Shipments.tsx"),
  route("sales/edit/:id", "pages/EditSale.tsx"),
  route("purchases/create", "pages/CreatePurchase.tsx"),
  route("purchases/all", "pages/AllPurchases.tsx"),
  route("purchases/edit/:id", "pages/EditPurchase.tsx"),
  route("purchases/view/:id", "pages/PurchaseView.tsx"),
] satisfies RouteConfig;
