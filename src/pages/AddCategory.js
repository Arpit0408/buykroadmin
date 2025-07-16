import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardBody,
  Label,
  Input,
  Button,
  Select,
} from "@windmill/react-ui";
import PageTitle from "../components/Typography/PageTitle";
import Icon from "../components/Icon";
import { HomeIcon } from "../icons";
import { NavLink } from "react-router-dom";

const FormTitle = ({ children }) => (
  <h2 className="mb-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
    {children}
  </h2>
);

const AddCategory = () => {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    parentCategory: "",
  });

  const [files, setFiles] = useState({
    image: null,
    banner: null,
    logo: null,
  });

  const [categories, setCategories] = useState([]);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Fetch categories on mount
  useEffect(() => {
    axios
      .get("https://bukrobackend-production.up.railway.app/api/categories")
      .then((res) => {
        setCategories(res.data);
        setError("");
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError("Failed to load categories");
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles.length > 0) {
      setFiles((prev) => ({ ...prev, [name]: selectedFiles[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("slug", form.slug);
    if (form.parentCategory) {
      formData.append("parentCategory", form.parentCategory);
    }
    if (files.image) formData.append("image", files.image);
    if (files.banner) formData.append("banner", files.banner);
    if (files.logo) formData.append("logo", files.logo);

    try {
      await axios.post("https://bukrobackend-production.up.railway.app/api/categories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      setSuccess("Category created successfully!");
      setError("");
      setForm({ name: "", slug: "", parentCategory: "" });
      setFiles({ image: null, banner: null, logo: null });
    } catch (err) {
      console.error("Submit error:", err);
      setError(
        err?.response?.data?.message || "Error creating category"
      );
    }
  };

  return (
    <div>
      <PageTitle>Add New Category</PageTitle>

      {/* Breadcrumb */}
      <div className="flex text-gray-800 dark:text-gray-300 mb-4">
        <div className="flex items-center text-purple-600">
          <Icon className="w-5 h-5" aria-hidden="true" icon={HomeIcon} />
          <NavLink exact to="/app/dashboard" className="mx-2">
            Dashboard
          </NavLink>
        </div>
        {">"}
        <p className="mx-2">Add New Category</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Side: Form Fields */}
          <Card>
            <CardBody>
              <FormTitle>Category Name</FormTitle>
              <Label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter category name"
                  className="mb-4"
                />
              </Label>

              <FormTitle>Slug</FormTitle>
              <Label>
                <Input
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  required
                  placeholder="Enter category slug"
                  className="mb-4"
                />
              </Label>

              <FormTitle>Parent Category</FormTitle>
              <Label>
                <Select
                  name="parentCategory"
                  value={form.parentCategory}
                  onChange={handleChange}
                  className="mb-4"
                >
                  <option value="">None</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              </Label>
            </CardBody>
          </Card>

          {/* Right Side: Image Uploads */}
          <Card>
            <CardBody>
              <FormTitle>Upload Images</FormTitle>

              {["image", "banner", "logo"].map((type) => (
                <div className="mb-4" key={type}>
                  <Label className="block mb-1 capitalize">{type}</Label>
                  <Input
                    type="file"
                    name={type}
                    onChange={handleFileChange}
                    className="text-gray-800 dark:text-gray-300"
                  />
                  {files[type] && (
                    <p className="text-xs text-gray-500 mt-1">
                      {files[type].name}
                    </p>
                  )}
                </div>
              ))}

              {error && (
                <p className="text-red-600 text-sm mt-2">{error}</p>
              )}
              {success && (
                <p className="text-green-600 text-sm mt-2">{success}</p>
              )}

              <div className="mt-6 text-right">
                <Button type="submit">Create Category</Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default AddCategory;
