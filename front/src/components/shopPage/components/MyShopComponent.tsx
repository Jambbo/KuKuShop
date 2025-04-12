import React, { useState, useEffect } from "react";
import { FaShoppingCart, FaSearch, FaPlus } from "react-icons/fa";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import ShopBanner from "./ShopBanner";
import { Link } from "react-router-dom";
import Product from "../../../entity/Product";
import ProductCard from "./ProductCard";
import ShopEntity from "../../../entity/ShopEntity";
import ErrorPage from "../../utils/ErrorPage";

const MyShopComponent = () => {
  const [error, setError] = useState<string | null>(null);
  const [shopImage, setShopImage] = useState("/Default.png");
  const [shop, setShop] = useState<ShopEntity>({} as ShopEntity);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { getAccessTokenSilently } = useAuth0();

  useEffect(() => {
      const fetchShopImage = async () => {
          const token = await getAccessTokenSilently();
      
          const response = await fetch("http://localhost:8080/api/shop/myShopImage", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
      
          if (response.ok) {
            const imageUrl = await response.text(); 
            setShopImage(imageUrl); 
          } else {
            setShopImage("/ShopBanner.png"); 
          }
        
      };
      fetchShopImage();
    }, [getAccessTokenSilently]);

  useEffect(() => {
    const fetchShopProducts = async () => {
      try {
        const token = await getAccessTokenSilently();
        const response = await axios.get("http://localhost:8080/api/product/getMyProducts", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const productsData = Array.isArray(response.data) ? response.data : [];
        setProducts(productsData);
      } catch (err) {
        setError("Error fetching products");
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchShopProducts();
  }, []);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const token = await getAccessTokenSilently();
        const response = await axios.get("http://localhost:8080/api/shop/myShop", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200) {
          setShop(response.data);
        } else {
          setError("Shop not found");
        }
      } catch (err) {
        setError("Error fetching shop data");
        console.error("Error fetching shop:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, [getAccessTokenSilently]);


  const toggleFavorite = (productId: string | number) => {
    setProducts(products.map(product => 
      product.id === productId 
        ? { ...product, favorite: !product.favorite }
        : product
    ));
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const AddMoreCard = () => (
    <div className="bg-gray-800 rounded-lg overflow-hidden h-full flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors duration-300">
      <Link to={"/productForm"}>
      <div className="text-center p-8">
        <FaPlus className="w-12 h-12 text-purple-500 mx-auto mb-4" />
        <p className="text-white font-semibold">Add More Items</p>
      </div>
      </Link>
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-16">
      <FaShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <h3 className="text-2xl font-bold text-white mb-4">You don't have any items yet</h3>
      <Link to={"/productForm"}>
      <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300">
        Create New Item
      </button>
      </Link>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  if(error) {
    return <ErrorPage errorCode={error} />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <ShopBanner imageUrl={shopImage} title={shop.name} />
      <nav className="bg-gray-900 p-4 sticky top-0 z-50 border-b border-gray-800">
        <div className="container mx-auto flex items-center justify-center">
          <div className="relative w-full max-w-2xl">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <FaSearch className="absolute right-3 top-3 text-gray-400" />
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 bg-gray-900">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white text-center">Featured Products</h2>
        </div>

        {filteredProducts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} onToggleFavorite={toggleFavorite} />
            ))}
            <AddMoreCard />
          </div>
        )}
      </main>
    </div>
  );
};

export default MyShopComponent;