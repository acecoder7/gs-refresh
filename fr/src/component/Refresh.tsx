import React, { useState } from "react";
import {
  Plus,
  Package,
  ShoppingCart,
  Calendar,
  Trash2,
  Edit2,
  Save,
  X,
} from "lucide-react";

interface Item {
  id: number;
  name: string;
  price: number;
}

interface CartItem extends Item {
  quantity: number;
}

interface Purchase {
  id: number;
  items: CartItem[];
  total: number;
  date: string;
  timestamp: string;
}

const Refresh: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"purchase" | "manage" | "reports">(
    "purchase"
  );
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: "Coffee", price: 25 },
    { id: 2, name: "Tea", price: 20 },
    { id: 3, name: "Sandwich", price: 80 },
    { id: 4, name: "Cookies", price: 30 },
    { id: 5, name: "Samosa", price: 15 },
    { id: 6, name: "Biscuits", price: 10 },
    { id: 7, name: "Chips", price: 20 },
    { id: 8, name: "Cold Drink", price: 25 },
  ]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [newItem, setNewItem] = useState<{ name: string; price: string }>({
    name: "",
    price: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Add item to cart
  const addToCart = (item: Item) => {
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      setCart(
        cart.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  // Remove from cart
  const removeFromCart = (itemId: number) => {
    setCart(cart.filter((c) => c.id !== itemId));
  };

  // Update cart quantity
  const updateCartQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) return removeFromCart(itemId);
    setCart(cart.map((c) => (c.id === itemId ? { ...c, quantity } : c)));
  };

  // Complete purchase → show confirm
  const completePurchase = () => {
    if (cart.length === 0) return;
    setShowConfirmModal(true);
  };

  // Confirm purchase
  const confirmPurchase = () => {
    const total = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
    const purchase: Purchase = {
      id: Date.now(),
      items: [...cart],
      total,
      date: new Date().toISOString(),
      timestamp: new Date().toLocaleString(),
    };
    setPurchases([...purchases, purchase]);
    setCart([]);
    setShowConfirmModal(false);
    alert("Purchase completed successfully!");
  };

  // Add new catalog item
  const addNewItem = () => {
    if (!newItem.name || !newItem.price) {
      alert("Please fill all fields");
      return;
    }
    const item: Item = {
      id: Date.now(),
      name: newItem.name,
      price: parseFloat(newItem.price),
    };
    setItems([...items, item]);
    setNewItem({ name: "", price: "" });
    setShowAddForm(false);
  };

  // Start editing
  const startEditing = (item: Item) => setEditingItem({ ...item });

  // Save edited item
  const saveEdit = () => {
    if (!editingItem) return;
    const updated = editingItem;
    if (!updated.name || !updated.price) {
      alert("Please provide valid values");
      return;
    }
    setItems(items.map((item) => (item.id === updated.id ? updated : item)));
    setEditingItem(null);
  };

  // Delete item
  const deleteItem = (itemId: number) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setItems(items.filter((i) => i.id !== itemId));
    }
  };

  // Filter and totals for reports
  const filteredPurchases = purchases.filter(
    (p) => p.date.split("T")[0] === selectedDate
  );
  const getTotalForDate = () =>
    filteredPurchases.reduce((sum, p) => sum + p.total, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Refreshment Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your workplace refreshments
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
          <button
            onClick={() => setActiveTab("purchase")}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${
              activeTab === "purchase"
                ? "bg-white text-green-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <ShoppingCart size={18} />
            <span>Purchase Items</span>
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${
              activeTab === "manage"
                ? "bg-white text-green-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Package size={18} />
            <span>Manage Catalog</span>
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${
              activeTab === "reports"
                ? "bg-white text-green-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Calendar size={18} />
            <span>Daily Reports</span>
          </button>
        </div>

        {/* Purchase Tab */}
        {activeTab === "purchase" && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Available Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Available Items
                  </h2>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {items.length} items
                  </span>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="group relative bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 hover:from-green-100 hover:to-green-200 transition-all duration-200 cursor-pointer border border-green-200 hover:border-green-300"
                      onClick={() => addToCart(item)}
                    >
                      <div className="relative z-10">
                        {/* Item Icon/Avatar */}
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3 mx-auto group-hover:bg-green-600 transition-colors">
                          <span className="text-white font-bold text-lg">
                            {item.name.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        {/* Item Name */}
                        <h3 className="font-medium text-gray-800 text-center text-sm mb-2 leading-tight">
                          {item.name}
                        </h3>

                        {/* Price */}
                        <div className="text-center">
                          <span className="text-lg font-bold text-green-700">
                            ₹{item.price}
                          </span>
                        </div>
                      </div>
                      <div className="absolute inset-0 -z-10 bg-green-600 bg-opacity-0 group-hover:bg-opacity-10 rounded-xl transition-all duration-200 pointer-events-none" />
                      {/* Hover Add Effect */}
                      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="bg-white rounded-full p-2 shadow-lg">
                            <Plus size={16} className="text-green-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Stats */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      Price Range: ₹{Math.min(...items.map((i) => i.price))} - ₹
                      {Math.max(...items.map((i) => i.price))}
                    </span>
                    <span>Click any item to add to cart</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cart */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Cart</h2>
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Your cart is empty
                </p>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          <p className="text-xs text-gray-500">
                            ₹{item.price} each
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              updateCartQuantity(item.id, item.quantity - 1)
                            }
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm hover:bg-gray-300"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateCartQuantity(item.id, item.quantity + 1)
                            }
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm hover:bg-gray-300"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-lg text-green-600">
                        ₹
                        {cart.reduce(
                          (sum, item) => sum + item.price * item.quantity,
                          0
                        )}
                      </span>
                    </div>
                    <button
                      onClick={completePurchase}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                    >
                      Complete Purchase
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Manage Catalog Tab */}
        {activeTab === "manage" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Manage Catalog</h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2 transition-colors"
              >
                <Plus size={18} />
                <span>Add Item</span>
              </button>
            </div>

            {/* Add Item Form */}
            {showAddForm && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium mb-3">Add New Item</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={newItem.name}
                    onChange={(e) =>
                      setNewItem({ ...newItem, name: e.target.value })
                    }
                    className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={newItem.price}
                    onChange={(e) =>
                      setNewItem({ ...newItem, price: e.target.value })
                    }
                    className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={addNewItem}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2 transition-colors"
                  >
                    <Save size={16} />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewItem({ name: "", price: "" });
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 flex items-center space-x-2 transition-colors"
                  >
                    <X size={16} />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            )}

            {/* Items List */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium">
                      Item Name
                    </th>
                    <th className="text-left py-3 px-4 font-medium">Price</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {editingItem && editingItem.id === item.id ? (
                          <input
                            type="text"
                            value={editingItem.name}
                            onChange={(e) =>
                              setEditingItem({
                                ...editingItem,
                                name: e.target.value,
                              })
                            }
                            className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        ) : (
                          item.name
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingItem && editingItem.id === item.id ? (
                          <input
                            type="number"
                            value={editingItem.price}
                            onChange={(e) =>
                              setEditingItem({
                                ...editingItem,
                                price: parseFloat(e.target.value),
                              })
                            }
                            className="px-2 py-1 border rounded w-20 focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        ) : (
                          `₹${item.price}`
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingItem && editingItem.id === item.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={saveEdit}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEditing(item)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Daily Purchase Reports</h2>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="mb-4 p-4 bg-green-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  Total Sales for {selectedDate}:
                </span>
                <span className="text-xl font-bold text-green-600">
                  ₹{getTotalForDate()}
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {filteredPurchases.length} transaction
                {filteredPurchases.length !== 1 ? "s" : ""}
              </div>
            </div>

            {filteredPurchases.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No purchases found for this date
              </p>
            ) : (
              <div className="space-y-4">
                {filteredPurchases.reverse().map((purchase) => (
                  <div key={purchase.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium">Purchase #{purchase.id}</h3>
                        <p className="text-sm text-gray-500">
                          {purchase.timestamp}
                        </p>
                      </div>
                      <span className="font-semibold text-green-600">
                        ₹{purchase.total}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {purchase.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-sm bg-gray-50 p-2 rounded"
                        >
                          <span>
                            {item.name} × {item.quantity}
                          </span>
                          <span>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-green-50 px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                Confirm Your Purchase
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Please review your items before completing the purchase
              </p>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 max-h-60 overflow-y-auto">
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{item.name}</h4>
                      <p className="text-sm text-gray-600">
                        ₹{item.price} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-green-600">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Section */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">
                    Total Amount:
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    ₹
                    {cart.reduce(
                      (sum, item) => sum + item.price * item.quantity,
                      0
                    )}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} item
                  {cart.reduce((sum, item) => sum + item.quantity, 0) !== 1
                    ? "s"
                    : ""}{" "}
                  in total
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t flex space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmPurchase}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
              >
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Refresh;
