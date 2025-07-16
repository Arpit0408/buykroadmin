import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from 'react-router-dom';
import PageTitle from "../components/Typography/PageTitle";
import {
  EditIcon,
  GridViewIcon,
  HomeIcon,
  ListViewIcon,
  TrashIcon,
} from "../icons";
import {
  Card,
  CardBody,
  Label,
  Select,
  Button,
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
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@windmill/react-ui";
import Icon from "../components/Icon";
import { genRating } from "../utils/genarateRating";

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const cleanedPath = path.startsWith("/") ? path.slice(1) : path;
  return `https://bukrobackend-production.up.railway.app/${cleanedPath}`;
};

const ProductsAll = () => {
  const [view, setView] = useState("grid");
  const [page, setPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(10);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDeleteProduct, setSelectedDeleteProduct] = useState(null);


  useEffect(() => {
    let isMounted = true;

    const fetchProductsAndCategories = async () => {
      try {
        setLoading(true);
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get("https://bukrobackend-production.up.railway.app/api/products"),
          axios.get("https://bukrobackend-production.up.railway.app/api/categories"),
        ]);

        if (isMounted) {
          // The backend now returns products with totalStock and variants
          setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
          setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to fetch products or categories");
          setLoading(false);
        }
      }
    };

    fetchProductsAndCategories();
    return () => { isMounted = false; };
  }, []);

  const filteredProducts = selectedCategory
    ? products.filter((p) => {
        if (typeof p.category === "object" && p.category !== null) {
          return p.category._id === selectedCategory;
        }
        return p.category === selectedCategory;
      })
    : products;

  const totalResults = filteredProducts.length;
  const paginatedData = filteredProducts.slice(
    (page - 1) * resultsPerPage,
    page * resultsPerPage
  );

  const onPageChange = (p) => setPage(p);

  const openDeleteModal = (productId) => {
    const product = products.find((p) => p._id === productId);
    setSelectedDeleteProduct(product);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedDeleteProduct(null);
  };

  const handleDelete = async () => {
    if (!selectedDeleteProduct) return;
    try {
      await axios.delete(`https://bukrobackend-production.up.railway.app/api/products/${selectedDeleteProduct._id}`);
      setProducts(products.filter((p) => p._id !== selectedDeleteProduct._id));
      closeDeleteModal();
    } catch (error) {
      alert("Failed to delete product: " + (error.response?.data?.message || error.message));
    }
  };

  const handleChangeView = () => {
    setView((prev) => (prev === "list" ? "grid" : "list"));
  };

  if (loading) return <div className="text-center mt-10">Loading products...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

  return (
    <div>
      <PageTitle>All Products</PageTitle>

      <div className="flex text-gray-800 dark:text-gray-300 mb-4">
        <div className="flex items-center text-purple-600">
          <Icon className="w-5 h-5" aria-hidden="true" icon={HomeIcon} />
          <Link exact="true" to="/app/dashboard" className="mx-2">Dashboard</Link>
        </div>
        <span>{">"}</span>
        <p className="mx-2">All Products</p>
      </div>

      <Card className="mb-5 shadow-md">
        <CardBody>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center flex-wrap gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">All Products</p>

              <Label>
                <Select className="py-3">
                  <option>Sort by</option>
                  <option>Asc</option>
                  <option>Desc</option>
                </Select>
              </Label>

              <Label>
                <Select
                  className="py-3"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">Filter by Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              </Label>

              <Label className="relative">
                <input
                  type="number"
                  min="1"
                  className="py-3 pr-20 pl-3 text-sm text-black dark:text-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:border-purple-400 focus:outline-none focus:shadow-outline-purple form-input"
                  placeholder="Number of Results"
                  value={resultsPerPage}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val > 0) setResultsPerPage(val);
                  }}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500 dark:text-gray-400">
                  {view.charAt(0).toUpperCase() + view.slice(1)} View
                </div>
              </Label>
            </div>

            <Button
              icon={view === "list" ? GridViewIcon : ListViewIcon}
              className="p-2"
              aria-label="Change view"
              onClick={handleChangeView}
            />
          </div>
        </CardBody>
      </Card>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
        <ModalHeader className="flex items-center">
          <Icon icon={TrashIcon} className="w-6 h-6 mr-3" />
          Delete Product
        </ModalHeader>
        <ModalBody>
          Are you sure you want to delete{" "}
          <strong>{selectedDeleteProduct?.name || "this product"}</strong>?
        </ModalBody>
        <ModalFooter>
          <Button layout="outline" onClick={closeDeleteModal}>
            Cancel
          </Button>
          <Button onClick={handleDelete}>Delete</Button>
        </ModalFooter>
      </Modal>

      {view === "list" ? (
        <TableContainer className="mb-8">
          <Table>
            <TableHeader>
              <tr>
                <TableCell>Name</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Action</TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {paginatedData.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Avatar
                        className="hidden mr-4 md:block"
                        src={getImageUrl(product.images?.[0]) || "/placeholder.jpg"}
                        alt="Product"
                      />
                      <div>
                        <p className="font-semibold">{product.name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {/* Display totalStock from product object */}
                    <Badge type={product.totalStock > 0 ? "success" : "danger"}>
                      {product.totalStock > 0 ? `In Stock (${product.totalStock})` : "Out of Stock"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {genRating(product.rating || 4.5, product.reviews?.length || 0, 5)}
                  </TableCell>
                  <TableCell className="text-sm">${product.basePrice}</TableCell>{/* Display basePrice */}
                  <TableCell>
                    <div className="flex">
                 <Link to={`/app/edit-product/${product._id}`}>
                  <Button
                    icon={EditIcon}
                    layout="outline"
                    aria-label="Edit"
                  />
                </Link>
                      <Button
                        icon={TrashIcon}
                        layout="outline"
                        onClick={() => openDeleteModal(product._id)}
                        aria-label="Delete"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TableFooter>
            <Pagination
              totalResults={totalResults}
              resultsPerPage={resultsPerPage}
              label="Table navigation"
              onChange={onPageChange}
            />
          </TableFooter>
        </TableContainer>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-8">
            {paginatedData.map((product) => (
              <Card key={product._id}>
                <img
                  className="object-cover w-full h-48"
                  src={getImageUrl(product.images?.[0]) || "/placeholder.jpg"}
                  alt={product.name}
                />
                <CardBody>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-semibold truncate text-gray-600 dark:text-gray-300">
                      {product.name}
                    </p>
                    {/* Display totalStock from product object */}
                    <Badge
                      type={product.totalStock > 0 ? "success" : "danger"}
                      className="whitespace-nowrap"
                    >
                      {product.totalStock > 0 ? `In Stock (${product.totalStock})` : "Out of Stock"}
                    </Badge>
                  </div>
                  <div className="mb-2 flex items-center justify-between">
                    {genRating(product.rating || 4.5, product.reviews?.length || 0, 5)}
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                      ${product.basePrice}
                    </p> {/* Display basePrice */}
                  </div>
                  <div className="flex justify-between items-center">
                  <Link to={`/app/edit-product/${product._id}`}>
                  <Button
                    icon={EditIcon}
                    layout="outline"
                    aria-label="Edit"
                  />
                </Link>

                    <Button
                      icon={TrashIcon}
                      layout="outline"
                      onClick={() => openDeleteModal(product._id)}
                      aria-label="Delete"
                    />
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
          <Pagination
            totalResults={totalResults}
            resultsPerPage={resultsPerPage}
            label="Table navigation"
            onChange={onPageChange}
          />
        </>
      )}
    </div>
  );
};

export default ProductsAll;