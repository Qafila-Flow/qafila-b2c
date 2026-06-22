export interface StoryVendor {
  id: string;
  storeName: string;
  storeNameAr: string;
  slug: string;
  logo: string | null;
  isFollowing?: boolean;
}

export interface Story {
  id: string;
  vendorId: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  caption: string | null;
  captionAr: string | null;
  linkType: "NONE" | "PRODUCT" | "CATEGORY" | "EXTERNAL";
  linkId: string | null;
  linkUrl: string | null;
  isActive: boolean;
  expiresAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  hasViewed: boolean;
  hasLiked: boolean;
  vendor: StoryVendor;
  linkedProduct?: StoryLinkedProduct | null;
}

export interface StoryLinkedProduct {
  id: string;
  name: string;
  nameAr: string;
  description: string | null;
  descriptionAr: string | null;
  slug: string;
  image: string | null;
  price: number;
  originalPrice: number | null;
  discount: number | null;
  rating: number;
  reviewCount: number;
}

export interface StoryCommentUser {
  id: string;
  firstName: string;
  lastName: string;
}

export interface StoryComment {
  id: string;
  storyId: string;
  userId: string;
  parentId: string | null;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: StoryCommentUser;
  replies?: StoryComment[];
}

export interface StoryCommentsPaginatedResponse {
  data: StoryComment[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ToggleLikeResponse {
  liked: boolean;
  likeCount: number;
}

export interface GroupedStories {
  vendor: StoryVendor;
  stories: Story[];
  allViewed: boolean;
  latestStoryAt: string;
}

export interface StoriesPaginatedResponse {
  data: GroupedStories[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
