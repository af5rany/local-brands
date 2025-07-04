// export type UserRole = "admin" | "brandOwner" | "user";

export const getRecentActivity = (userRole: UserRole) => {
  if (userRole === "admin") {
    return [
      {
        title: "New User Registered",
        subtitle: "john@example.com joined the platform",
        time: "2h ago",
        icon: "person-add",
        color: "#10b981",
      },
      {
        title: "Brand Approved",
        subtitle: "Nike brand was approved",
        time: "4h ago",
        icon: "checkmark-circle",
        color: "#346beb",
      },
      {
        title: "Product Reported",
        subtitle: "iPhone 15 Pro reported for review",
        time: "6h ago",
        icon: "warning",
        color: "#f59e0b",
      },
    ];
  } else if (userRole === "brandOwner") {
    return [
      {
        title: "New Order",
        subtitle: "Order #1234 received",
        time: "1h ago",
        icon: "bag-add",
        color: "#10b981",
      },
      {
        title: "Product Updated",
        subtitle: "MacBook Pro details updated",
        time: "3h ago",
        icon: "create",
        color: "#346beb",
      },
      {
        title: "Review Received",
        subtitle: "New 5-star review on iPhone 15",
        time: "5h ago",
        icon: "star",
        color: "#f59e0b",
      },
    ];
  } else {
    return [
      {
        title: "Order Shipped",
        subtitle: "Your order #5678 has been shipped",
        time: "2h ago",
        icon: "car",
        color: "#10b981",
      },
      {
        title: "Item Back in Stock",
        subtitle: "iPhone 15 Pro is now available",
        time: "4h ago",
        icon: "cube",
        color: "#346beb",
      },
      {
        title: "Price Drop Alert",
        subtitle: "MacBook Pro price reduced by 10%",
        time: "6h ago",
        icon: "trending-down",
        color: "#ef4444",
      },
    ];
  }
};
