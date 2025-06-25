import React, { useState, useEffect } from "react";
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
import { supabase } from "../lib/supabase";

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
  const [activeTab, setActiveTab] = useState<"purchase" | "manage" | "reports">("purchase");
  const [items, setItems] = useState<Item[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [newItem, setNewItem] = useState<{ name: string; price: string }>({ name: "", price: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ─── helper to load all purchases + their items ─────────────────────
  const fetchPurchases = async () => {
    const { data, error } = await supabase
      .from("purchases")
      .select(`
        id,
        total,
        purchased_at,
        purchase_items (
          quantity,
          items (
            id,
            name,
            price
          )
        )
      `)
      .order("purchased_at", { ascending: false });

    if (error) {
      console.error("Error loading purchases:", error);
      return;
    }

    setPurchases(
      data.map((p) => ({
        id: p.id,
        total: p.total,
        date: p.purchased_at,
        timestamp: new Date(p.purchased_at).toLocaleString(),
        items: p.purchase_items.map((pi: any) => ({
          id: pi.items.id,
          name: pi.items.name,
          price: pi.items.price,
          quantity: pi.quantity,
        })),
      }))
    );
  };

  // ─── initial load: items + purchases ────────────────────────────────
  useEffect(() => {
    supabase
      .from("items")
      .select("*")
      .order("name")
      .then(({ data, error }) => {
        if (error) console.error("Error loading items:", error);
        else setItems(data || []);
      });
    fetchPurchases();
  }, []);

  // ─── CART ACTIONS ───────────────────────────────────────────────────
  const addToCart = (item: Item) => {
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      setCart(cart.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };
  const removeFromCart = (itemId: number) => setCart(cart.filter((c) => c.id !== itemId));
  const updateCartQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) return removeFromCart(itemId);
    setCart(cart.map((c) => (c.id === itemId ? { ...c, quantity } : c)));
  };
  const completePurchase = () => {
    if (cart.length === 0) return;
    setShowConfirmModal(true);
  };

  // ─── CONFIRM PURCHASE ────────────────────────────────────────────────
  const confirmPurchase = async () => {
    const total = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

    // 1) create purchase record
    const { data: newPurchase, error: pErr } = await supabase
      .from("purchases")
      .insert([{ total }])
      .select("id")
      .single();
    if (pErr || !newPurchase) {
      console.error("Purchase insert failed:", pErr);
      alert("Failed to record purchase");
      return;
    }

    // 2) insert line-items
    const { error: piErr } = await supabase
      .from("purchase_items")
      .insert(
        cart.map((c) => ({
          purchase_id: newPurchase.id,
          item_id: c.id,
          quantity: c.quantity,
        }))
      );
    if (piErr) {
      console.error("Line-items insert failed:", piErr);
      alert("Failed to record line items");
      return;
    }

    // 3) reload purchases, clear cart, close modal
    await fetchPurchases();
    setCart([]);
    setShowConfirmModal(false);
    alert("Purchase completed successfully!");
  };

  // ─── CATALOG CRUD ───────────────────────────────────────────────────
  const addNewItem = async () => {
    if (!newItem.name || !newItem.price) {
      alert("Please fill all fields");
      return;
    }
    const { data: added, error } = await supabase
      .from("items")
      .insert([{ name: newItem.name, price: parseInt(newItem.price, 10) }])
      .select();
    if (error) {
      console.error("Add item error:", error);
      alert("Failed to add item");
    } else {
      setItems((prev) => [...prev, added![0]]);
      setNewItem({ name: "", price: "" });
      setShowAddForm(false);
    }
  };

  const saveEdit = async () => {
    if (!editingItem) return;
    const { data: updated, error } = await supabase
      .from("items")
      .update({ name: editingItem.name, price: editingItem.price })
      .eq("id", editingItem.id)
      .select();
    if (error) {
      console.error("Update item error:", error);
      alert("Failed to update");
    } else {
      setItems(items.map((i) => (i.id === editingItem.id ? updated![0] : i)));
      setEditingItem(null);
    }
  };

  const deleteItem = async (itemId: number) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    const { error } = await supabase.from("items").delete().eq("id", itemId);
    if (error) {
      console.error("Delete item error:", error);
      alert("Failed to delete");
    } else {
      setItems(items.filter((i) => i.id !== itemId));
    }
  };

  const startEditing = (item: Item) => {
    setEditingItem(item);
  };

  // ─── REPORTS FILTER ─────────────────────────────────────────────────
  const filteredPurchases = purchases.filter((p) => p.date.split("T")[0] === selectedDate);
  const getTotalForDate = () => filteredPurchases.reduce((sum, p) => sum + p.total, 0);

  // ─── RENDER ─────────────────────────────────────────────────────────
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

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
          {/** Purchase Tab **/}
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

          {/** Manage Tab **/}
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

          {/** Reports Tab **/}
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

        {/** PURCHASE VIEW **/}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="group relative bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 hover:from-green-100 hover:to-green-200 transition-all duration-200 cursor-pointer border border-green-200 hover:border-green-300"
                      onClick={() => addToCart(item)}
                    >
                      <div className="relative z-10">
                        {/* Icon */}
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3 mx-auto group-hover:bg-green-600 transition-colors">
                          <span className="text-white font-bold text-lg">
                            {item.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {/* Name */}
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
                      {/* dimming overlay */}
                      <div className="absolute inset-0 -z-10 bg-green-600 bg-opacity-0 group-hover:bg-opacity-10 rounded-xl transition-all duration-200 pointer-events-none" />
                      {/* plus icon overlay */}
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
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      Price Range: ₹
                      {items.length
                        ? `${Math.min(...items.map((i) => i.price))} - ₹${
                            Math.max(...items.map((i) => i.price))
                          }`
                        : "0"}
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
                    {cart.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{c.name}</h4>
                          <p className="text-xs text-gray-500">
                            ₹{c.price} each
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              updateCartQuantity(c.id, c.quantity - 1)
                            }
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm hover:bg-gray-300"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm">
                            {c.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateCartQuantity(c.id, c.quantity + 1)
                            }
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm hover:bg-gray-300"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(c.id)}
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
                          (sum, c) => sum + c.price * c.quantity,
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

        {/** MANAGE CATALOG VIEW **/}
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
                  {items.map((i) => (
                    <tr key={i.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {editingItem?.id === i.id ? (
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
                          i.name
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingItem?.id === i.id ? (
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
                          `₹${i.price}`
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingItem?.id === i.id ? (
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
                              onClick={() => startEditing(i)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => deleteItem(i.id)}
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

        {/** REPORTS VIEW **/}
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
                <span className="text-gray-600">Total Sales for {selectedDate}:</span>
                <span className="text-xl font-bold text-green-600">₹{getTotalForDate()}</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {filteredPurchases.length} transaction{filteredPurchases.length !== 1 && "s"}
              </div>
            </div>

            {filteredPurchases.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No purchases found for this date</p>
            ) : (
              <div className="space-y-4">
                {filteredPurchases.map((p) => (
                  <div key={p.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium">Purchase #{p.id}</h3>
                        <p className="text-sm text-gray-500">{p.timestamp}</p>
                      </div>
                      <span className="font-semibold text-green-600">₹{p.total}</span>
                    </div>
                    <div className="space-y-2">
                      {p.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm bg-gray-50 p-2 rounded"
                        >
                          <span>
                            {it.name} × {it.quantity}
                          </span>
                          <span>₹{it.price * it.quantity}</span>
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

      {/** CONFIRMATION MODAL **/}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="bg-green-50 px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                Confirm Your Purchase
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Review your items before completing
              </p>
            </div>
            <div className="px-6 py-4 max-h-60 overflow-y-auto">
              <div className="space-y-3">
                {cart.map((c) => (
                  <div
                    key={c.id}
                    className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{c.name}</h4>
                      <p className="text-sm text-gray-600">
                        ₹{c.price} × {c.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-green-600">
                        ₹{c.price * c.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">
                    Total Amount:
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    ₹
                    {cart.reduce((sum, c) => sum + c.price * c.quantity, 0)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {cart.reduce((sum, c) => sum + c.quantity, 0)} item
                  {cart.reduce((sum, c) => sum + c.quantity, 0) !== 1
                    ? "s"
                    : ""}
                </p>
              </div>
            </div>
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
