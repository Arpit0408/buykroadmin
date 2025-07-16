import React, { useState, useEffect } from "react";
import {
  TableBody,
  TableContainer,
  Table,
  TableHeader,
  TableCell,
  TableRow,
  TableFooter,
  Avatar,
  Badge,
  Pagination,
  Select,
  Button,
} from "@windmill/react-ui";
import axios from "axios";

const OrdersTable = ({ resultsPerPage, filter }) => {
  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editedStatuses, setEditedStatuses] = useState({});

  const statusOptions = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://bukrobackend-production.up.railway.app/api/orders/allorder");
      let orders = res.data;

      if (filter && filter !== "all") {
        orders = orders.filter((order) =>
          filter === "paid"
            ? order.paymentStatus === "paid"
            : filter === "un-paid"
            ? order.paymentStatus === "pending"
            : filter === "completed"
            ? order.paymentStatus === "delivered" ||
              order.paymentStatus === "completed"
            : true
        );
      }

      setTotalResults(orders.length);
      setData(
        orders.slice((page - 1) * resultsPerPage, page * resultsPerPage)
      );
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, filter, resultsPerPage]);

  const handleStatusChange = (orderId, newStatus) => {
    setEditedStatuses((prev) => ({
      ...prev,
      [orderId]: newStatus,
    }));
  };

  const updateStatus = async (orderId) => {
    const newStatus = editedStatuses[orderId];
    if (!newStatus) return;

    try {
      await axios.patch(
        `https://bukrobackend-production.up.railway.app/api/orders/order/${orderId}/status`,
        { status: newStatus }
      );
      console.log("Order updated:", orderId, newStatus);

      setEditedStatuses((prev) => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });

      setTimeout(fetchOrders, 300);
    } catch (err) {
      console.error("Failed to update order status", err);
    }
  };

  return (
    <div>
      {loading && <p>Loading orders...</p>}
      <TableContainer className="mb-8">
        <Table>
          <TableHeader>
            <tr>
              <TableCell>Client</TableCell>
              <TableCell>Order ID</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Update</TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {data.map((order) => {
              const currentStatus =
                editedStatuses[order._id] || order.paymentStatus;
              return (
                <TableRow key={order._id}>
                  <TableCell>
                    <div className="flex items-center text-sm">
                   
                      <div>
                        <p className="font-semibold">
                          {order.user?.name || "User"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      #{order.razorpayOrderId || order._id.slice(-6)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">$ {order.totalAmount}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      type={
                        order.paymentStatus === "cancelled"
                          ? "danger"
                          : order.paymentStatus === "delivered"
                          ? "success"
                          : order.paymentStatus === "processing"
                          ? "warning"
                          : "neutral"
                      }
                    >
                      {order.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Select
  value={editedStatuses[order._id] ?? order.paymentStatus} // show edited or original
  onChange={(e) => handleStatusChange(order._id, e.target.value)}
  className="w-32"
>
  {statusOptions.map((status) => (
    <option key={status} value={status}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </option>
  ))}
</Select>

<Button
  layout="outline"
  size="small"
  onClick={() => updateStatus(order._id)}
  disabled={
    // Disable only if no change (edited status equals original)
    (editedStatuses[order._id] ?? order.paymentStatus) === order.paymentStatus
  }
>
  Update
</Button>

                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TableFooter>
          <Pagination
            totalResults={totalResults}
            resultsPerPage={resultsPerPage}
            label="Table navigation"
            onChange={setPage}
          />
        </TableFooter>
      </TableContainer>
    </div>
  );
};

export default OrdersTable;
