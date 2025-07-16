import React, { useState, useEffect } from "react";
import PageTitle from "../components/Typography/PageTitle";
import { Link, NavLink } from "react-router-dom";
import {
  EditIcon,
  EyeIcon,
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
  Pagination,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@windmill/react-ui";
import Icon from "../components/Icon";
import EditCategoryModal from "./EditCategoryModal"; // Adjust the path if needed

const API_URL = "https://bukrobackend-production.up.railway.app/api/categories";

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const cleanedPath = path.startsWith("/") ? path.slice(1) : path;
  return `https://bukrobackend-production.up.railway.app/${cleanedPath}`;
};

const CategoriesAll = () => {
  const [view, setView] = useState("grid");
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultsPerPage, setResultsPerPage] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeleteCategory, setSelectedDeleteCategory] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEditCategory, setSelectedEditCategory] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      setError(err.message || "Error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const totalResults = categories.length;
  const pagedCategories = categories.slice(
    (page - 1) * resultsPerPage,
    page * resultsPerPage
  );

  const openModal = (categoryId) => {
    const cat = categories.find((c) => c._id === categoryId);
    setSelectedDeleteCategory(cat);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDeleteCategory(null);
  };

  const handleDelete = async () => {
    if (!selectedDeleteCategory) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/${selectedDeleteCategory._id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete category");

      fetchCategories();
      closeModal();
    } catch (err) {
      alert(err.message || "Error deleting category");
    } finally {
      setDeleting(false);
    }
  };

  const handleChangeView = () => {
    setView((v) => (v === "list" ? "grid" : "list"));
  };

  const openEditModal = (cat) => {
    setSelectedEditCategory(cat);
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setSelectedEditCategory(null);
  };

  return (
    <div>
      <PageTitle>All Categories</PageTitle>

      {/* Breadcrumb */}
      <div className="flex text-gray-800 dark:text-gray-300 mb-4">
        <div className="flex items-center text-purple-600">
          <Icon className="w-5 h-5" aria-hidden="true" icon={HomeIcon} />
          <NavLink exact to="/app/dashboard" className="mx-2">
            Dashboard
          </NavLink>
        </div>
        {">"}
        <p className="mx-2">All Categories</p>
      </div>

      {/* Controls */}
      <Card className="mt-5 mb-5 shadow-md">
        <CardBody>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All Categories
              </p>
              <Label className="mx-3">
                <Select
                  className="py-3"
                  value={resultsPerPage}
                  onChange={(e) => {
                    setResultsPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                </Select>
              </Label>
            </div>
            <div>
              <Button
                icon={view === "list" ? ListViewIcon : GridViewIcon}
                className="p-2"
                aria-label="Toggle View"
                onClick={handleChangeView}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Loading & Error */}
      {loading && <p>Loading categories...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          {view === "list" ? (
            <TableContainer className="mb-8">
              <Table>
                <TableHeader>
                  <tr>
                    <TableCell>Name</TableCell>
                    <TableCell>Slug</TableCell>
                    <TableCell>Parent Category</TableCell>
                    <TableCell>Image</TableCell>
                    <TableCell>Banner</TableCell>
                    <TableCell>Logo</TableCell>
                    <TableCell>Action</TableCell>
                  </tr>
                </TableHeader>
                <TableBody>
                  {pagedCategories.map((cat) => (
                    <TableRow key={cat._id}>
                      <TableCell>{cat.name}</TableCell>
                      <TableCell>{cat.slug}</TableCell>
                      <TableCell>{cat.parentCategory?.name || "-"}</TableCell>
                      <TableCell>
                        {cat.image ? (
                          <Avatar src={getImageUrl(cat.image)} alt={cat.name} />
                        ) : (
                          "No Image"
                        )}
                      </TableCell>
                      <TableCell>
                        {cat.banner ? (
                          <Avatar src={getImageUrl(cat.banner)} alt={cat.name} />
                        ) : (
                          "No Banner"
                        )}
                      </TableCell>
                      <TableCell>
                        {cat.logo ? (
                          <Avatar src={getImageUrl(cat.logo)} alt={cat.name} />
                        ) : (
                          "No Logo"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex">
                          <Link to={`/app/category/${cat._id}`}>
                            <Button icon={EyeIcon} className="mr-3" aria-label="Preview" />
                          </Link>
                          <Button
                            icon={EditIcon}
                            className="mr-3"
                            layout="outline"
                            aria-label="Edit"
                            onClick={() => openEditModal(cat)}
                          />
                          <Button
                            icon={TrashIcon}
                            layout="outline"
                            onClick={() => openModal(cat._id)}
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
                  onChange={setPage}
                  currentPage={page}
                />
              </TableFooter>
            </TableContainer>
          ) : (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-8">
              {pagedCategories.map((cat) => (
                <Card key={cat._id}>
                  {cat.image ? (
                    <img
                      className="object-cover w-full h-40"
                      src={getImageUrl(cat.image)}
                      alt={cat.name}
                    />
                  ) : (
                    <div className="bg-gray-200 w-full h-40 flex items-center justify-center text-gray-500">
                      No Image
                    </div>
                  )}
                  <CardBody>
                    <p className="font-semibold truncate text-gray-600 dark:text-gray-300 mb-2">
                      {cat.name}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">{cat.slug}</p>
                    <div className="flex items-center justify-between">
                      <Link to={`/app/category/${cat._id}`}>
                        <Button
                          icon={EyeIcon}
                          className="mr-3"
                          aria-label="Preview"
                          size="small"
                        />
                      </Link>
                      <div>
                        <Button
                          icon={EditIcon}
                          className="mr-3"
                          layout="outline"
                          aria-label="Edit"
                          size="small"
                          onClick={() => openEditModal(cat)}
                        />
                        <Button
                          icon={TrashIcon}
                          layout="outline"
                          aria-label="Delete"
                          onClick={() => openModal(cat._id)}
                          size="small"
                        />
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Delete Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <ModalHeader className="flex items-center">
          <Icon icon={TrashIcon} className="w-6 h-6 mr-3" />
          Delete Category
        </ModalHeader>
        <ModalBody>
          Are you sure you want to delete category{" "}
          {selectedDeleteCategory && `"${selectedDeleteCategory.name}"`}?
        </ModalBody>
        <ModalFooter>
          <Button layout="outline" onClick={closeModal}>
            Cancel
          </Button>
          <Button onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Modal */}
      {isEditOpen && selectedEditCategory && (
        <EditCategoryModal
          isOpen={isEditOpen}
          onClose={closeEditModal}
          category={selectedEditCategory}
          onUpdate={fetchCategories}
        />
      )}
    </div>
  );
};

export default CategoriesAll;
