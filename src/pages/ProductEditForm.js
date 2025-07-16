import React, { useState, useEffect } from "react";
import axios from "axios";
import { NavLink, useParams } from "react-router-dom";
import Icon from "../components/Icon";
import PageTitle from "../components/Typography/PageTitle";
import { HomeIcon } from "../icons";
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
    <h2 className="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-300">
        {children}
    </h2>
);

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];

// Helper to get image URL for display
const getImageUrl = (path) => {
    if (!path) return null;
    // If path is already a full URL, use it directly
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    // Otherwise, construct the local URL. Ensure it's not double-slashed.
    const cleanedPath = path.startsWith("/") ? path.slice(1) : path;
    return `https://bukrobackend-production.up.railway.app/${cleanedPath}`;
};

const EditProduct = () => {
    // Get product ID from URL parameters
    const { id: productId } = useParams();
console.log("Editing product with ID:", productId);

    // Product main data state
    const [formData, setFormData] = useState({
        name: "",
        description: "", // This will hold the 'full' description part
        basePrice: "",
        category: "",
    });

    // Short description state, separated for UI input
    const [shortDescription, setShortDescription] = useState("");

    // Image states for the main product
    const [newImages, setNewImages] = useState([]); // Files for new product images to upload
    const [oldImages, setOldImages] = useState([]); // Paths/URLs of existing product images
    const [imagePreviews, setImagePreviews] = useState([]); // Previews for new product image files

    // Category data
    const [categories, setCategories] = useState([]);

    // Loading and error states
    const [loadingProduct, setLoadingProduct] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState(null);

    // Variations state - crucial for dynamic fields and their images
    const [variations, setVariations] = useState([]);

    // State to control which size popup is open (null if none, index of variation if open)
    const [showSizePopup, setShowSizePopup] = useState(null);

    // --- EFFECT: Fetch Categories and Product Data on component mount or productId change ---
    useEffect(() => {
        const fetchData = async () => {
            setLoadingProduct(true);
            setError(null);
            try {
                // Fetch Categories
                const categoriesRes = await axios.get("https://bukrobackend-production.up.railway.app/api/categories");
                setCategories(categoriesRes.data);

                // Fetch Product Data if productId is available
                if (productId) {
                    console.log("Fetching product data for ID:", productId);
                    const productRes = await axios.get(`https://bukrobackend-production.up.railway.app/api/products/${productId}`);
                    const productData = productRes.data;
                    console.log("Fetched product data:", productData);

                    // Handle description: split into short and full
                    const fullFetchedDescription = productData.description || "";
                    const descriptionParts = fullFetchedDescription.split('\n\n'); // Simple split by double newline
                    setShortDescription(descriptionParts[0] || ""); // First part as short description
                    setFormData({
                        name: productData.name || "",
                        description: descriptionParts.slice(1).join('\n\n') || "", // Rest as full description
                        basePrice: productData.basePrice || "",
                        category: productData.category?._id || "", // Ensure you get the _id if category is populated
                    });

                    setOldImages(productData.images || []); // Set existing main product images
                    setNewImages([]); // Clear any previously selected new files
                    setImagePreviews([]); // Clear new image previews

                    // Initialize variations with existing data from the fetched product
                    const initialVariations = (Array.isArray(productData.variations) ? productData.variations : []).map((v) => ({
                        _id: v._id, // **Crucial for identifying existing variations in update**
                        sku: v.sku || "",
                        price: v.price || "",
                        stock: v.stock || "",
                        // Ensure attributes object and size array are always initialized
                        attributes: {
                            size: Array.isArray(v.attributes?.size) ? v.attributes.size : [],
                            color: v.attributes?.color || "",
                            material: v.attributes?.material || ""
                        },
                        oldImages: v.images || [], // Existing images for THIS variation
                        newImages: [], // New images for THIS variation
                        imagePreviews: [], // Previews for new images for THIS variation
                    }));
                    // If no variations exist, add one empty variation to start with proper initial structure
                    setVariations(initialVariations.length > 0 ? initialVariations : [{
                        sku: "",
                        price: "",
                        stock: "",
                        attributes: { size: [], color: "", material: "" }, // Initialize attributes for new empty variation
                        oldImages: [],
                        newImages: [],
                        imagePreviews: []
                    }]);
                } else {
                    setError("No product ID provided for editing.");
                }
            } catch (err) {
                console.error("Error fetching product data:", err);
                setError(err.response?.data?.message || "Failed to load product data. Please check console for details.");
            } finally {
                setLoadingProduct(false);
            }
        };

        fetchData();
    }, [productId]); // Effect re-runs if productId changes in the URL

    // Close size popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showSizePopup !== null) {
                const popupElement = document.getElementById(`size-popup-${showSizePopup}`);
                const inputElement = document.getElementById(`size-input-${showSizePopup}`);

                if (popupElement && !popupElement.contains(event.target) && inputElement && !inputElement.contains(event.target)) {
                    setShowSizePopup(null);
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showSizePopup]);

    // --- Handlers for Main Product Images ---
    const handleNewImageChange = (e) => {
        const files = Array.from(e.target.files);
        setNewImages(files);
        const previews = files.map((file) => URL.createObjectURL(file));
        setImagePreviews(previews);
    };

    const removeOldImage = (index) => {
        setOldImages((prev) => {
            const updated = [...prev];
            updated.splice(index, 1);
            return updated;
        });
    };

    const removeNewImagePreview = (index) => {
        setNewImages((prev) => {
            const updated = [...prev];
            URL.revokeObjectURL(imagePreviews[index]); // Clean up URL object
            updated.splice(index, 1);
            return updated;
        });
        setImagePreviews((prev) => {
            const updated = [...prev];
            updated.splice(index, 1);
            return updated;
        });
    };

    // --- Handlers for Main Product Form Fields ---
    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    // --- Handlers for Variations ---
    const handleVariationChange = (index, field, value) => {
        const updated = [...variations];
        // Ensure attributes object exists before trying to access or set properties on it
        updated[index].attributes = updated[index].attributes || {};

        if (["size", "color", "material"].includes(field)) {
            // Special handling for nested attributes
            updated[index].attributes[field] = value;
        } else {
            updated[index][field] = value;
        }
        setVariations(updated);
    };

    const toggleSizeSelection = (variationIndex, size) => {
        const updatedVariations = [...variations];
        // Ensure attributes and size array exist
        updatedVariations[variationIndex].attributes = updatedVariations[variationIndex].attributes || {};
        updatedVariations[variationIndex].attributes.size = updatedVariations[variationIndex].attributes.size || [];

        const currentSizes = updatedVariations[variationIndex].attributes.size;

        if (currentSizes.includes(size)) {
            updatedVariations[variationIndex].attributes.size = currentSizes.filter((s) => s !== size);
        } else {
            updatedVariations[variationIndex].attributes.size = [...currentSizes, size];
        }
        setVariations(updatedVariations);
    };

    const handleSizeClick = (index) => {
        // Toggle the popup for the clicked variation
        setShowSizePopup(showSizePopup === index ? null : index);
    };

    const handleVariationNewImagesChange = (index, files) => {
        const updated = [...variations];
        updated[index].newImages = Array.from(files); // Store actual File objects
        const previews = Array.from(files).map((file) => URL.createObjectURL(file));
        updated[index].imagePreviews = previews; // Store URL previews
        setVariations(updated);
    };

    const removeOldVariationImage = (vIndex, imgIndex) => {
        setVariations((prev) => {
            const updated = [...prev];
            updated[vIndex].oldImages.splice(imgIndex, 1);
            return updated;
        });
    };

    const removeNewVariationImagePreview = (vIndex, imgIndex) => {
        setVariations((prev) => {
            const updated = [...prev];
            // Revoke URL for cleanup
            URL.revokeObjectURL(updated[vIndex].imagePreviews[imgIndex]);
            updated[vIndex].newImages.splice(imgIndex, 1);
            updated[vIndex].imagePreviews.splice(imgIndex, 1);
            return updated;
        });
    };

    const addVariation = () => {
        setVariations([
            ...variations,
            {
                sku: "",
                price: "",
                stock: "",
                attributes: { // Nested attributes - explicitly initialize
                    size: [],
                    color: "",
                    material: ""
                },
                oldImages: [],
                newImages: [],
                imagePreviews: [],
            },
        ]);
    };

    const removeVariation = (index) => {
        const updated = [...variations];
        // Revoke any new image URLs for the removed variation
        (updated[index].imagePreviews || []).forEach(url => URL.revokeObjectURL(url));
        updated.splice(index, 1);
        setVariations(updated);
    };

    // --- Form Submission Handler ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setError(null);

        // Basic validation
        if (!formData.name || !formData.basePrice || !formData.category) {
            setError("Please fill required product fields: Name, Base Price, and Category.");
            setSubmitLoading(false);
            return;
        }

        // Validate variations
        for (const [i, v] of variations.entries()) {
            if (!v.sku || !v.price || !v.stock) {
                setError(`Please fill SKU, Price, and Stock for Variation #${i + 1}`);
                setSubmitLoading(false);
                return;
            }
        }

        const payload = new FormData();

        // Append main product data
        payload.append("name", formData.name);
        // Combine short and full description for submission
        payload.append("description", `${shortDescription}\n\n${formData.description}`);
        payload.append("basePrice", parseFloat(formData.basePrice));
        payload.append("category", formData.category);

        // Append main product old images (as JSON string)
        payload.append("oldImages", JSON.stringify(oldImages));
        // Append new product images (files)
        newImages.forEach((file) => payload.append("images", file));

        // Prepare variations data for backend (excluding new image files here)
        const variationsToSend = variations.map((v) => ({
            _id: v._id, // Send _id for existing variations to backend
            sku: v.sku,
            price: parseFloat(v.price),
            stock: parseInt(v.stock, 10),
            attributes: { // Ensure attributes are sent as an object, with defaults if needed
                size: Array.isArray(v.attributes?.size) ? v.attributes.size : [],
                color: v.attributes?.color || "",
                material: v.attributes?.material || "",
            },
            oldImages: v.oldImages || [], // Existing variation images paths (those kept by frontend)
        }));
        payload.append("variations", JSON.stringify(variationsToSend));

        // Append new variant images with dynamic fieldnames (e.g., variantImages[0], variantImages[1])
        variations.forEach((v, vIdx) => {
            (v.newImages || []).forEach((file) => {
                payload.append(`variantImages[${vIdx}]`, file);
            });
        });

        try {
            await axios.put(`https://bukrobackend-production.up.railway.app/api/products/${productId}`, payload, {
                headers: {
                    "Content-Type": "multipart/form-data", // Important for file uploads
                },
            });
            alert("✅ Product updated successfully!");
            // Optionally, redirect or refetch data if needed
            // For now, we'll just alert and let user stay on page
        } catch (err) {
            console.error("Failed to update product:", err);
            setError(err.response?.data?.message || err.message || "An unknown error occurred during update.");
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loadingProduct) {
        return <PageTitle>Loading Product...</PageTitle>;
    }

    return (
        <div>
            <PageTitle>Edit Product</PageTitle>

            {/* Breadcrumb */}
            <div className="flex text-gray-800 dark:text-gray-300 mb-4">
                <div className="flex items-center text-purple-600">
                    <Icon className="w-5 h-5" aria-hidden="true" icon={HomeIcon} />
                    <NavLink exact="true" to="/app/dashboard" className="mx-2">
                        Dashboard
                    </NavLink>
                </div>
                <span>{">"}</span>
                <NavLink to="/app/products" className="mx-2">
                    Products
                </NavLink>
                <span>{">"}</span>
                <p className="mx-2">Edit Product</p>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Error:</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="w-full mt-8 grid gap-4 grid-cols-1 md:grid-cols-3">
                {/* Product Form - Main Details */}
                <Card className="row-span-2 md:col-span-2">
                    <CardBody>
                        <FormTitle>Product Images</FormTitle>
                        {/* Display existing product images */}
                        <div className="flex gap-4 mb-4 flex-wrap">
                            {oldImages.length > 0 ? (
                                oldImages.map((src, i) => (
                                    <div key={`old-img-${i}`} className="relative">
                                        <img
                                            src={getImageUrl(src)}
                                            alt={`existing-product-${i}`}
                                            className="h-20 w-20 object-cover rounded border dark:border-gray-600"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeOldImage(i)}
                                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs hover:bg-red-800 transition-colors"
                                            title="Remove image"
                                            disabled={submitLoading}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm">No existing product images.</p>
                            )}
                        </div>

                        {/* Input for new product images */}
                        <Label className="block mb-4">
                            <span>Upload New Product Images</span>
                            <Input
                                type="file"
                                multiple
                                name="images"
                                accept="image/*"
                                onChange={handleNewImageChange}
                                className="mt-1 block w-full text-gray-800 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                                disabled={submitLoading}
                            />
                        </Label>

                        {/* Preview new product images */}
                        <div className="flex gap-4 mb-4 flex-wrap">
                            {imagePreviews.map((src, i) => (
                                <div key={`new-img-prev-${i}`} className="relative">
                                    <img
                                        src={src}
                                        alt={`new-product-preview-${i}`}
                                        className="h-20 w-20 object-cover rounded border dark:border-gray-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeNewImagePreview(i)}
                                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs hover:bg-red-800 transition-colors"
                                        title="Remove new image preview"
                                        disabled={submitLoading}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>

                        <FormTitle>Product Name *</FormTitle>
                        <Label className="mb-4">
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter product name"
                                className="mt-1"
                                disabled={submitLoading}
                                required
                            />
                        </Label>

                        <FormTitle>Base Price *</FormTitle>
                        <Label className="mb-4">
                            <Input
                                name="basePrice"
                                type="number"
                                value={formData.basePrice}
                                onChange={handleChange}
                                placeholder="Enter base price"
                                className="mt-1"
                                min="0"
                                step="0.01"
                                disabled={submitLoading}
                                required
                            />
                        </Label>

                        <FormTitle>Short Description</FormTitle>
                        <Label className="mb-4">
                            <Textarea
                                rows="3"
                                value={shortDescription}
                                onChange={(e) => setShortDescription(e.target.value)}
                                placeholder="Short description (optional)"
                                className="mt-1"
                                disabled={submitLoading}
                            />
                        </Label>

                        <FormTitle>Full Description</FormTitle>
                        <Label className="mb-4">
                            <Textarea
                                name="description"
                                rows="5"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Full description"
                                className="mt-1"
                                disabled={submitLoading}
                            />
                        </Label>

                        <FormTitle>Product Variations</FormTitle>
                        {variations.map((variation, index) => (
                            <div
                                key={variation._id || `new-variant-${index}`} // Use _id if it's an existing variant, otherwise fallback
                                className="mb-6 flex gap-3 items-end flex-wrap md:flex-nowrap border p-3 rounded-lg relative dark:border-gray-700"
                            >
                                <div className="absolute top-2 right-2">
                                    {variations.length > 1 && ( // Allow removing if more than one variation
                                        <Button
                                            size="small"
                                            layout="link"
                                            onClick={() => removeVariation(index)}
                                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                            aria-label="Remove variation"
                                            disabled={submitLoading}
                                        >
                                            ❌ Remove
                                        </Button>
                                    )}
                                </div>

                                <div className="flex flex-col flex-1 min-w-[120px]">
                                    <span>SKU *</span>
                                    <Input
                                        value={variation.sku}
                                        onChange={(e) =>
                                            handleVariationChange(index, "sku", e.target.value)
                                        }
                                        placeholder="Unique SKU"
                                        disabled={submitLoading}
                                        required
                                    />
                                </div>

                                <div className="flex flex-col flex-1 min-w-[100px]">
                                    <span>Price *</span>
                                    <Input
                                        type="number"
                                        value={variation.price}
                                        onChange={(e) =>
                                            handleVariationChange(index, "price", e.target.value)
                                        }
                                        placeholder="Price"
                                        min="0"
                                        step="0.01"
                                        disabled={submitLoading}
                                        required
                                    />
                                </div>

                                <div className="flex flex-col flex-1 min-w-[100px]">
                                    <span>Stock *</span>
                                    <Input
                                        type="number"
                                        value={variation.stock}
                                        onChange={(e) =>
                                            handleVariationChange(index, "stock", e.target.value)
                                        }
                                        placeholder="Stock quantity"
                                        min="0"
                                        disabled={submitLoading}
                                        required
                                    />
                                </div>

                                {/* Size input with popup */}
                                <div className="flex flex-col flex-1 min-w-[80px] relative">
                                    <span>Size</span>
                                    <input
                                        id={`size-input-${index}`}
                                        type="text"
                                        readOnly
                                        onClick={() => handleSizeClick(index)}
                                        // **FIX: Ensure variation.attributes is always an object, and size an array**
                                        value={variation.attributes?.size?.join(", ") || ""}
                                        placeholder="Select sizes"
                                        className="border rounded px-2 py-1 cursor-pointer dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 focus:outline-none focus:border-purple-400"
                                        disabled={submitLoading}
                                    />

                                    {showSizePopup === index && (
                                        <div
                                            id={`size-popup-${index}`}
                                            className="absolute top-full left-0 z-50 bg-white border rounded shadow-lg p-2 mt-1 max-w-xs w-max dark:bg-gray-800 dark:border-gray-700"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {SIZE_OPTIONS.map((size) => (
                                                <label
                                                    key={size}
                                                    className="flex items-center space-x-2 mb-1 cursor-pointer dark:text-gray-300"
                                                >
                                                    <Input
                                                        type="checkbox"
                                                        // **FIX: Ensure variation.attributes.size is an array before checking includes**
                                                        checked={variation.attributes?.size?.includes(size) || false}
                                                        onChange={() => toggleSizeSelection(index, size)}
                                                        className="form-checkbox text-purple-600"
                                                        disabled={submitLoading}
                                                    />
                                                    <span>{size}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col flex-1 min-w-[80px]">
                                    <span>Color</span>
                                    <Input
                                        value={variation.attributes.color} // Access through attributes
                                        onChange={(e) =>
                                            handleVariationChange(index, "color", e.target.value)
                                        }
                                        placeholder="e.g. Red"
                                        disabled={submitLoading}
                                    />
                                </div>

                                <div className="flex flex-col flex-1 min-w-[80px]">
                                    <span>Material</span>
                                    <Input
                                        value={variation.attributes.material} // Access through attributes
                                        onChange={(e) =>
                                            handleVariationChange(index, "material", e.target.value)
                                        }
                                        placeholder="e.g. Cotton"
                                        disabled={submitLoading}
                                    />
                                </div>

                                {/* Variant Images: Existing and New */}
                                <div className="flex flex-col w-full">
                                    <span>Existing Variant Images</span>
                                    <div className="mt-2 flex gap-2 flex-wrap mb-2">
                                        {variation.oldImages.length > 0 ? (
                                            variation.oldImages.map((src, i) => (
                                                <div key={`var-old-img-${index}-${i}`} className="relative">
                                                    <img
                                                        src={getImageUrl(src)}
                                                        alt={`variant-existing-${index}-${i}`}
                                                        className="h-16 w-16 object-cover rounded border dark:border-gray-600"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeOldVariationImage(index, i)}
                                                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs hover:bg-red-800 transition-colors"
                                                        title="Remove image"
                                                        disabled={submitLoading}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-sm">No existing variant images.</p>
                                        )}
                                    </div>

                                    <span>Upload New Variant Images</span>
                                    <Input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={(e) =>
                                            handleVariationNewImagesChange(index, e.target.files)
                                        }
                                        className="mt-1 block w-full text-gray-800 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                                        disabled={submitLoading}
                                    />
                                    <div className="mt-2 flex gap-2 flex-wrap">
                                        {variation.imagePreviews.map((src, i) => (
                                            <div key={`var-new-img-prev-${index}-${i}`} className="relative">
                                                <img
                                                    src={src}
                                                    alt="variant preview"
                                                    className="h-16 w-16 object-cover rounded border dark:border-gray-600"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeNewVariationImagePreview(index, i)}
                                                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs hover:bg-red-800 transition-colors"
                                                    title="Remove new image preview"
                                                    disabled={submitLoading}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}

                        <Button layout="outline" size="small" onClick={addVariation} disabled={submitLoading} className="mt-4">
                            ➕ Add Variation
                        </Button>
                    </CardBody>
                </Card>

                {/* Category Selector */}
                <Card>
                    <CardBody>
                        <Label className="mt-4">
                            <FormTitle>Select Product Category *</FormTitle>
                            <Select
                                value={formData.category}
                                onChange={(e) =>
                                    setFormData({ ...formData, category: e.target.value })
                                }
                                className="mt-1"
                                disabled={submitLoading}
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

                        <div className="w-full mt-6">
                            <Button type="submit" size="large" onClick={handleSubmit} disabled={submitLoading}>
                                {submitLoading ? "Updating Product..." : "Update Product"}
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </form>
        </div>
    );
};

export default EditProduct;