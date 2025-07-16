import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Label,
  Input,
  Select,
  Button,
} from "@windmill/react-ui";
import axios from "axios";

const EditCategoryModal = ({ isOpen, onClose, category, onUpdate }) => {
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load available categories for parent selection
  useEffect(() => {
    axios
      .get("https://bukrobackend-production.up.railway.app/api/categories")
      .then((res) => setCategories(res.data))
      .catch(() => setError("Failed to fetch categories"));
  }, []);

  // Sync form with selected category
  useEffect(() => {
    if (category) {
      setForm({
        name: category.name || "",
        slug: category.slug || "",
        parentCategory: category.parentCategory?._id || "",
      });
      setFiles({
        image: null,
        banner: null,
        logo: null,
      });
      setError("");
    }
  }, [category]);

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

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
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
      await axios.put(
        `https://bukrobackend-production.up.railway.app/api/categories/${category._id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );
      onUpdate(); // refresh list
      onClose();  // close modal
    } catch (err) {
      setError(err?.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>Edit Category</ModalHeader>
      <ModalBody>
        <Label className="mb-2">
          <span>Name</span>
          <Input name="name" value={form.name} onChange={handleChange} required />
        </Label>

        <Label className="mb-2 mt-4">
          <span>Slug</span>
          <Input name="slug" value={form.slug} onChange={handleChange} required />
        </Label>

        <Label className="mb-4 mt-4">
          <span>Parent Category</span>
          <Select name="parentCategory" value={form.parentCategory} onChange={handleChange}>
            <option value="">None</option>
            {categories
              .filter((c) => c._id !== category?._id)
              .map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
          </Select>
        </Label>

        {["image", "banner", "logo"].map((type) => (
          <Label key={type} className="block mb-3">
            <span className="capitalize">{type}</span>
            <Input type="file" name={type} onChange={handleFileChange} />
            {category?.[type] && (
              <img
                src={`https://bukrobackend-production.up.railway.app/${category[type].replace(/^\//, "")}`}
                alt={`${type}`}
                className="w-20 mt-2 rounded"
              />
            )}
          </Label>
        ))}

        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </ModalBody>

      <ModalFooter>
        <div className="w-full flex justify-end gap-3">
          <Button layout="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Updating..." : "Update"}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default EditCategoryModal;
