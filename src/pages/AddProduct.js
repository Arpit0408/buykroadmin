import React, { useState, useEffect } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import Icon from "../components/Icon";
import PageTitle from "../components/Typography/PageTitle";
import { HomeIcon, AddIcon } from "../icons";
import { AiOutlinePlus, AiOutlineClose } from "react-icons/ai";
import {
  Card,
  CardBody,
  Label,
  Input,
  Textarea,
  Button,
  Select,
} from "@windmill/react-ui";

const FormTitle = ({ children }) => (
  <h2 className="mb-3 text-lg font-semibold text-gray-700 dark:text-gray-300 border-b pb-1">
    {children}
  </h2>
);

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];

const AddProduct = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    basePrice: "",
    category: "",
  });

  const [shortDescription, setShortDescription] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [categories, setCategories] = useState([]);

  const [variations, setVariations] = useState([
    {
      sku: "",
      price: "",
      stock: "",
      size: [],
      color: "",
      material: "",
      images: [],
      imagePreviews: [],
    },
  ]);

  const [showSizePopup, setShowSizePopup] = useState(null);

  useEffect(() => {
    axios
      .get("https://bukrobackend-production.up.railway.app/api/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Error fetching categories", err));
  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleVariationChange = (index, field, value) => {
    const updated = [...variations];
    updated[index][field] = value;
    setVariations(updated);
  };

  const toggleSizeSelection = (variationIndex, size) => {
    const updated = [...variations];
    const sizeArr = updated[variationIndex].size || [];

    if (sizeArr.includes(size)) {
      updated[variationIndex].size = sizeArr.filter((s) => s !== size);
    } else {
      updated[variationIndex].size = [...sizeArr, size];
    }

    setVariations(updated);
  };

  const handleSizeClick = (index) => {
    setShowSizePopup(showSizePopup === index ? null : index);
  };

  const handleVariationImagesChange = (index, files) => {
    const updated = [...variations];
    updated[index].images = Array.from(files);
    updated[index].imagePreviews = Array.from(files).map((file) =>
      URL.createObjectURL(file)
    );
    setVariations(updated);
  };

  const addVariation = () => {
    setVariations([
      ...variations,
      {
        sku: "",
        price: "",
        stock: "",
        size: [],
        color: "",
        material: "",
        images: [],
        imagePreviews: [],
      },
    ]);
  };

  const removeVariation = (index) => {
    const updated = [...variations];
    updated.splice(index, 1);
    setVariations(updated);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.basePrice || !formData.category) {
      alert("Please fill required fields: Name, Base Price, and Category.");
      return;
    }

    for (const [i, v] of variations.entries()) {
      if (!v.sku || !v.price || !v.stock) {
        alert(`Please fill SKU, Price, and Stock for variation #${i + 1}`);
        return;
      }
    }

    const formattedVariations = variations.map((v) => ({
      sku: v.sku,
      price: parseFloat(v.price),
      stock: parseInt(v.stock, 10),
      attributes: {
        size: v.size,
        color: v.color,
        material: v.material,
      },
    }));

    const data = new FormData();

    images.forEach((file) => data.append("images", file));

   variations.forEach((v, idx) => {
  v.images.forEach((file) => {
    data.append(`variantImages[${idx}]`, file);
  });
});


    data.append("name", formData.name);
    data.append("description", `${shortDescription}\n\n${formData.description}`);
    data.append("basePrice", formData.basePrice);
    data.append("category", formData.category);
    data.append("variations", JSON.stringify(formattedVariations));

    try {
      await axios.post("https://bukrobackend-production.up.railway.app/api/products", data);
      alert("✅ Product added successfully");

      // Reset form
      setFormData({
        name: "",
        description: "",
        basePrice: "",
        category: "",
      });
      setShortDescription("");
      setImages([]);
      setImagePreviews([]);
      setVariations([
        {
          sku: "",
          price: "",
          stock: "",
          size: [],
          color: "",
          material: "",
          images: [],
          imagePreviews: [],
        },
      ]);
      setShowSizePopup(null);
    } catch (error) {
      alert(
        "❌ Failed to add product: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageTitle>Add New Product</PageTitle>

      <nav className="flex items-center text-gray-600 dark:text-gray-400 mb-6 text-sm space-x-2">
        <Icon className="w-5 h-5" aria-hidden="true" icon={HomeIcon} />
        <NavLink
          exact
          to="/app/dashboard"
          className="hover:text-purple-600 transition"
        >
          Dashboard
        </NavLink>
        <span className="select-none">{">"}</span>
        <p className="font-semibold text-gray-700 dark:text-gray-300">
          Add New Product
        </p>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left section */}
        <Card className="md:col-span-2 shadow-lg">
          <CardBody>
            <FormTitle>Product Images</FormTitle>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="mb-5 rounded border border-gray-300 p-2 cursor-pointer w-full"
            />
            <div className="flex flex-wrap gap-4 mb-6">
              {imagePreviews.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`preview-${i}`}
                  className="h-24 w-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                />
              ))}
            </div>

            <FormTitle>Product Name</FormTitle>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter product name"
              className="mb-5"
              required
            />

            <FormTitle>Base Price</FormTitle>
            <Input
              name="basePrice"
              type="number"
              value={formData.basePrice}
              onChange={handleChange}
              placeholder="Enter base price"
              className="mb-5"
              required
              min={0}
              step="0.01"
            />

            <FormTitle>Short Description</FormTitle>
            <Textarea
              rows="3"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Short description"
              className="mb-5"
              maxLength={250}
            />

            <FormTitle>Full Description</FormTitle>
            <Textarea
              name="description"
              rows="5"
              value={formData.description}
              onChange={handleChange}
              placeholder="Full description"
              className="mb-6"
              required
            />

            <FormTitle>Product Variations</FormTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              {variations.map((variation, index) => (
                <div
                  key={index}
                  className="relative flex flex-col gap-4 p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800"
                >
                  <Input
                    value={variation.sku}
                    onChange={(e) =>
                      handleVariationChange(index, "sku", e.target.value)
                    }
                    placeholder="SKU *"
                    required
                  />
                  <Input
                    type="number"
                    value={variation.price}
                    onChange={(e) =>
                      handleVariationChange(index, "price", e.target.value)
                    }
                    placeholder="Price *"
                    min={0}
                    step="0.01"
                    required
                  />
                  <Input
                    type="number"
                    value={variation.stock}
                    onChange={(e) =>
                      handleVariationChange(index, "stock", e.target.value)
                    }
                    placeholder="Stock *"
                    min={0}
                    required
                  />

                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      onClick={() => handleSizeClick(index)}
                      value={variation.size.join(", ")}
                      placeholder="Select sizes"
                      className="border rounded px-3 py-2 cursor-pointer w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                      aria-label="Select sizes"
                    />
                    {showSizePopup === index && (
                      <div className="absolute top-full left-0 z-50 bg-white border rounded shadow-lg p-3 mt-1 max-w-xs">
                        {SIZE_OPTIONS.map((size) => (
                          <label
                            key={size}
                            className="flex items-center space-x-3 mb-2 cursor-pointer text-gray-700 dark:text-gray-300"
                          >
                            <input
                              type="checkbox"
                              checked={variation.size.includes(size)}
                              onChange={() => toggleSizeSelection(index, size)}
                              className="cursor-pointer"
                            />
                            <span>{size}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <Input
                    value={variation.color}
                    onChange={(e) =>
                      handleVariationChange(index, "color", e.target.value)
                    }
                    placeholder="Color"
                  />

                  <Input
                    value={variation.material}
                    onChange={(e) =>
                      handleVariationChange(index, "material", e.target.value)
                    }
                    placeholder="Material"
                  />

                  <div className="flex flex-col">
                    <Label className="mb-1 font-semibold text-gray-700 dark:text-gray-300">
                      Variant Images
                    </Label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) =>
                        handleVariationImagesChange(index, e.target.files)
                      }
                      className="cursor-pointer"
                    />
                    <div className="mt-2 flex gap-3 flex-wrap">
                      {variation.imagePreviews.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt="variant preview"
                          className="h-20 w-20 object-cover rounded-lg border border-gray-200 shadow-sm"
                        />
                      ))}
                    </div>
                  </div>

                  {variations.length > 1 && (
                    <Button
                      size="small"
                      layout="link"
                      onClick={() => removeVariation(index)}
                      className="self-start text-red-600 absolute top-3 right-3 hover:text-red-700"
                      aria-label="Remove variation"
                    >
                      <AiOutlineClose size={22} />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              layout="outline"
              size="small"
              onClick={addVariation}
              aria-label="Add variation"
              className="mb-8 flex items-center space-x-2 text-purple-600 hover:text-purple-800 border-purple-600"
            >
              <AiOutlinePlus size={20} />
              <span>Add Variation</span>
            </Button>

            <div>
              <Button
                size="large"
                iconLeft={AddIcon}
                onClick={handleSubmit}
                className="w-full bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
              >
                Add Product
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Right section */}
        <Card className="shadow-lg">
          <CardBody>
            <Label className="mt-4">
              <FormTitle>Select Product Category</FormTitle>
              <Select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="mt-1"
                required
              >
                <option value="">-- Select a category --</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </Label>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default AddProduct;
