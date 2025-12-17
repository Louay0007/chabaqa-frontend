import { apiClient, ApiSuccessResponse } from './client';
import { productsApi } from './products.api';
import { communitiesApi } from './communities.api';
import { getMe } from './user.api';
import type { Product, ProductVariant, ProductFile } from './types';

export interface ProductWithDetails {
  id: string;
  title: string;
  slug: string;
  description: string;
  communityId: string;
  creatorId: string;
  thumbnail?: string;
  price: number;
  type: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  images: string[];
  category: string;
  sales: number;
  rating: number;
  inventory?: number;
  features?: string[];
  licenseTerms?: string;
  variants?: ProductVariant[];
  files?: ProductFile[];
  creator?: {
    id: string;
    name: string;
    avatar?: string;
  };
  isPurchased?: boolean;
  purchaseDate?: string;
}

export interface ProductPurchase {
  userId: string;
  downloadCount: number;
  id: string;
  productId: string;
  product: ProductWithDetails;
  purchasedAt: string;
  price: number;
}

export interface ProductsPageData {
  community: any;
  products: ProductWithDetails[];
  userPurchases: ProductPurchase[];
  currentUser: any;
}

/**
 * Transform backend product data to frontend format
 */
function transformProduct(backendProduct: any): ProductWithDetails {
  // Transform variants
  const variants = (backendProduct.variants || []).map((variant: any) => ({
    id: String(variant._id || variant.id || ''),
    name: variant.name || '',
    price: variant.price || 0,
    description: variant.description || undefined,
    stock: variant.inventory || variant.stock || undefined,
  }));

  // Transform files
  const files = (backendProduct.files || []).map((file: any) => ({
    id: String(file._id || file.id || ''),
    name: file.name || '',
    url: file.url || '',
    type: file.type || 'file',
    size: file.size || 0,
    description: file.description || undefined,
    order: file.order || 0,
    downloadCount: file.downloadCount || 0,
    isActive: file.isActive !== false,
    uploadedAt: file.uploadedAt || new Date().toISOString(),
  }));

  // Transform creator
  const creator = backendProduct.creatorId ? {
    id: String(backendProduct.creatorId._id || backendProduct.creatorId.id || backendProduct.creatorId || ''),
    name: backendProduct.creatorId.name || backendProduct.creator?.name || 'Unknown',
    avatar: backendProduct.creatorId.profile_picture || backendProduct.creatorId.avatar || backendProduct.creator?.avatar || undefined,
  } : {
    id: String(backendProduct.creatorId || backendProduct.creator?.id || ''),
    name: backendProduct.creator?.name || 'Unknown',
    avatar: backendProduct.creator?.avatar || undefined,
  };

  // Get images
  const images = backendProduct.images || (backendProduct.thumbnail ? [backendProduct.thumbnail] : []);

  return {
    id: String(backendProduct._id || backendProduct.id || ''),
    title: backendProduct.title || '',
    slug: backendProduct.slug || '',
    description: backendProduct.description || '',
    communityId: String(backendProduct.communityId?._id || backendProduct.communityId?.id || backendProduct.communityId || backendProduct.community?.id || ''),
    creatorId: String(backendProduct.creatorId?._id || backendProduct.creatorId?.id || backendProduct.creatorId || ''),
    thumbnail: backendProduct.thumbnail || backendProduct.images?.[0] || undefined,
    price: backendProduct.price || 0,
    type: backendProduct.type || 'digital',
    isPublished: backendProduct.isPublished !== false,
    createdAt: backendProduct.createdAt || new Date().toISOString(),
    updatedAt: backendProduct.updatedAt || new Date().toISOString(),
    // Additional fields for component compatibility
    variants,
    files,
    creator,
    images,
    category: backendProduct.category || 'General',
    sales: backendProduct.sales || 0,
    rating: backendProduct.rating || 0,
    inventory: backendProduct.inventory || undefined,
    features: backendProduct.features || [],
    licenseTerms: backendProduct.licenseTerms || undefined,
  };
}

/**
 * Transform backend purchase data to frontend format
 */
function transformPurchase(backendPurchase: any): ProductPurchase {
  const product = backendPurchase.product || backendPurchase;
  
  return {
    id: String(backendPurchase._id || backendPurchase.id || ''),
    productId: String(product._id || product.id || ''),
    product: transformProduct(product),
    purchasedAt: backendPurchase.purchasedAt || backendPurchase.createdAt || new Date().toISOString(),
    price: backendPurchase.price || product.price || 0,
    userId: String(backendPurchase.userId || ''),
    downloadCount: backendPurchase.downloadCount || 0,
  };
}

/**
 * Products Community API Service
 */
export const productsCommunityApi = {
  /**
   * Fetch all data needed for products page
   */
  async getProductsPageData(slug: string): Promise<ProductsPageData> {
    try {
      const normalisedSlug = decodeURIComponent(slug).trim();

      // First, get the community to get its ID
      const communityResponse = await communitiesApi.getBySlug(normalisedSlug);
      const communityPayload = (communityResponse as any)?.data?.data ?? communityResponse?.data;
      const community = Array.isArray(communityPayload) ? communityPayload[0] : communityPayload;
      const communityId = community?.id ?? community?._id ?? community?.communityId;

      if (!community || !communityId) {
        throw new Error('Community not found');
      }

      // Fetch in parallel
      const [productsResponse, userPurchasesResponse, currentUser] = await Promise.allSettled([
        // Get products by community ID - backend endpoint: GET /products/community/:communityId
        apiClient
          .get<ApiSuccessResponse<{ products: any[] }>>(`/products/community/${communityId}`, { page: 1, limit: 100 })
          .catch(() => null),
        // Get user purchases - backend endpoint: GET /products/my-purchases
        apiClient
          .get<ApiSuccessResponse<{ products: any[] }>>('/products/my-purchases')
          .catch(() => null),
        getMe().catch(() => null),
      ]);

      // Handle products
      let products: ProductWithDetails[] = [];
      if (productsResponse.status === 'fulfilled' && productsResponse.value) {
        const productsData = productsResponse.value;
        // Backend returns { success: true, data: { products: [...], pagination: {...} } }
        const productsList = productsData?.data?.products ?? [];
        products = Array.isArray(productsList)
          ? productsList.map(transformProduct)
          : [];
      }

      // Handle user purchases
      let userPurchases: ProductPurchase[] = [];
      if (userPurchasesResponse.status === 'fulfilled' && userPurchasesResponse.value) {
        const purchasesData = userPurchasesResponse.value;
        // Backend returns { success: true, products: [...] }
        const purchasesList = purchasesData?.data?.products ?? [];

        // Transform purchases
        userPurchases = Array.isArray(purchasesList)
          ? purchasesList.map(transformPurchase)
          : [];
      }

      // Transform current user
      const user = currentUser.status === 'fulfilled' && currentUser.value
        ? {
            id: String(currentUser.value._id || currentUser.value.id || ''),
            email: currentUser.value.email || '',
            username: currentUser.value.username || currentUser.value.name || '',
            firstName: currentUser.value.firstName || currentUser.value.name?.split(' ')[0] || undefined,
            lastName: currentUser.value.lastName || currentUser.value.name?.split(' ').slice(1).join(' ') || undefined,
            avatar: currentUser.value.avatar || currentUser.value.profile_picture || undefined,
            bio: currentUser.value.bio || undefined,
            role: currentUser.value.role || 'member',
            verified: currentUser.value.verified || false,
            createdAt: currentUser.value.createdAt || new Date().toISOString(),
            updatedAt: currentUser.value.updatedAt || new Date().toISOString(),
          }
        : null;

      // Mark products as purchased if user has purchases
      const purchasedProductIds = new Set(userPurchases.map(p => p.productId));
      products = products.map(product => ({
        ...product,
        isPurchased: purchasedProductIds.has(product.id),
      }));

      return {
        community,
        products,
        userPurchases,
        currentUser: user,
      };
    } catch (error) {
      console.error('Error fetching products page data:', error);
      throw error;
    }
  },
};


