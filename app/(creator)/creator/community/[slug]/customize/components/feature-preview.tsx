import React from 'react';
import { CheckCircle, Users, Star, Award, Calendar, Clock } from 'lucide-react';
import Image from 'next/image';
interface FeatureHeroPreviewProps {
  community: {
    name: string;
    description: string;
    creator: string;
    creatorAvatar?: string;
    members: number;
    rating: number;
    category: string;
    tags: string[];
    verified: boolean;
    price: number;
    priceType: string;
    type: "community" | "course" | "challenge" | "event" | "oneToOne" | "product";
    coverImage?: string;
    settings: {
      primaryColor: string;
      secondaryColor: string;
      logo?: string;
    };
  };
  previewDevice: "desktop" | "tablet" | "mobile";
}

export default function FeatureHeroPreview({ community, previewDevice }: FeatureHeroPreviewProps) {
  const getTypeConfig = (type: string) => {
    const configs = {
      community: {
        color: "from-blue-500 to-blue-600",
        badgeColor: "border-blue-500/50 text-blue-600 bg-blue-50",
        icon: Users,
        ctaText: "Join Community",
      },
      course: {
        color: "from-[#47c7ea] to-[#86e4fd]",
        badgeColor: "border-[#47c7ea]/50 text-[#47c7ea] bg-[#47c7ea]/10",
        icon: Award,
        ctaText: "Start Learning",
      },
      challenge: {
        color: "from-[#ff9b28] to-[#fdb863]",
        badgeColor: "border-[#ff9b28]/50 text-[#ff9b28] bg-[#ff9b28]/10",
        icon: Award,
        ctaText: "Join Challenge",
      },
      event: {
        color: "from-indigo-500 to-indigo-600",
        badgeColor: "border-indigo-500/50 text-indigo-600 bg-indigo-50",
        icon: Calendar,
        ctaText: "Register Now",
      },
      oneToOne: {
        color: "from-[#f65887] to-[#fb8ba8]",
        badgeColor: "border-[#f65887]/50 text-[#f65887] bg-[#f65887]/10",
        icon: Clock,
        ctaText: "Book Session",
      },
      product: {
        color: "from-purple-500 to-purple-600",
        badgeColor: "border-purple-500/50 text-purple-600 bg-purple-50",
        icon: Award,
        ctaText: "Get Product",
      },
    };
    return configs[type as keyof typeof configs] || configs.community;
  };

  const typeConfig = getTypeConfig(community.type);
  const IconComponent = typeConfig.icon;

  const formatPrice = (price: number, type: string) => {
    if (type === "free") return "Free";
    if (type === "per session") return `$${price}/session`;
    if (type === "one-time") return `$${price}`;
    return `$${price}/${type === "monthly" ? "mo" : type}`;
  };

  const formatMembers = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const getAvatarPlaceholder = () => {
    return community.creator.charAt(0);
  };

  // Scale everything down uniformly based on device
  const scale = previewDevice === "mobile" ? 0.28 : previewDevice === "tablet" ? 0.45 : 0.6;
  
  // Determine if we should show mobile or desktop layout
  const isMobileView = previewDevice === "mobile";
  const isTabletView = previewDevice === "tablet";

  return (
    <div 
      className="w-full h-full overflow-auto"
      style={{ 
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: `${100 / scale}%`,
        height: `${100 / scale}%`
      }}
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-purple-50/30 min-h-full">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-5"
            style={{
              background: `linear-gradient(to bottom right, ${community.settings.primaryColor}, ${community.settings.secondaryColor})`
            }}
          />
          <div
            className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-5"
            style={{
              background: `linear-gradient(to top right, ${community.settings.primaryColor}, ${community.settings.secondaryColor})`
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-2 py-3 sm:py-4 lg:py-6">
          {/* Header: Logo + Badges */}
          <div className="flex justify-between items-center mb-1 sm:mb-2">
            {/* Logo */}
            <div className="flex items-center gap-0.5">
              {isMobileView ? (
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-base"
                  style={{ backgroundColor: community.settings.primaryColor }}>
                  {community.settings.logo ? (
                    <img 
                      src={community.settings.logo} 
                      alt="Logo" 
                      className="w-full h-full object-contain rounded-lg" 
                    />
                  ) : (
                    community.name.charAt(0)
                  )}
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-base"
                  style={{ backgroundColor: community.settings.primaryColor }}>
                  {community.settings.logo ? (
                    <img 
                      src={community.settings.logo} 
                      alt="Logo" 
                      className="w-full h-full object-contain rounded-lg" 
                    />
                  ) : (
                    community.name.charAt(0)
                  )}
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2">
              <div
                className="border text-xs px-2.5 py-1 font-semibold capitalize rounded-md flex items-center gap-1"
                style={{
                  borderColor: `${community.settings.primaryColor}50`,
                  color: community.settings.primaryColor,
                  backgroundColor: `${community.settings.primaryColor}10`
                }}
              >
                <IconComponent className="w-3 h-3" />
                {community.type}
              </div>
              {community.verified && (
                <div
                  className="text-white border-0 px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1"
                  style={{
                    background: `linear-gradient(to right, ${community.settings.primaryColor}, ${community.settings.secondaryColor})`
                  }}
                >
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </div>
              )}
            </div>
          </div>

          <div className={`grid items-center ${isMobileView || isTabletView ? 'grid-cols-1 gap-6' : 'grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12'}`}>
            {/* Left content */}
            <div className={`${isMobileView || isTabletView ? 'order-last' : ''} space-y-4 sm:space-y-5`}>
              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                {community.name}
              </h1>

              {/* Description */}
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                {community.description}
              </p>

              {/* Creator info */}
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-full ring-2 ring-gray-100 bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm">
                  {community.creatorAvatar ? (
                    <img 
                      src={community.creatorAvatar} 
                      alt={community.creator} 
                      className="w-full h-full rounded-full object-cover" 
                    />
                  ) : (
                    getAvatarPlaceholder()
                  )}
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Created by</p>
                  <p className="text-sm font-semibold text-gray-900">{community.creator}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-2 sm:gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg flex-1">
                  <Users 
                    className="w-4 h-4 flex-shrink-0" 
                    style={{ color: community.settings.primaryColor }}
                  />
                  <div>
                    <p className="text-[10px] text-gray-500">Members</p>
                    <p className="text-sm font-bold text-gray-900">{formatMembers(community.members)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg flex-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-500">Rating</p>
                    <p className="text-sm font-bold text-gray-900">{community.rating}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg flex-1">
                  <div 
                    className="w-4 h-4 flex items-center justify-center font-bold text-xs flex-shrink-0"
                    style={{ color: community.settings.primaryColor }}
                  >
                    #
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Category</p>
                    <p className="text-sm font-bold text-gray-900">{community.category}</p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {community.tags.map((tag, index) => (
                  <div
                    key={index}
                    className="border rounded-md px-2 py-0.5 text-[11px] font-medium"
                    style={{
                      borderColor: `${community.settings.primaryColor}30`,
                      color: community.settings.primaryColor,
                      backgroundColor: `${community.settings.primaryColor}05`
                    }}
                  >
                    {tag}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className={`flex items-stretch sm:items-center gap-3 pt-2 ${isMobileView ? 'flex-col' : 'flex-col sm:flex-row'}`}>
                <div className="flex flex-col">
                  <span className="text-xl sm:text-2xl font-bold text-gray-900">
                    {formatPrice(community.price, community.priceType)}
                  </span>
                  {community.priceType !== "free" && (
                    <span className="text-xs text-gray-500">{community.priceType}</span>
                  )}
                </div>
                <button
                  className="flex-1 text-sm font-semibold shadow-sm transition-all h-11 rounded-lg text-white px-6"
                  style={{
                    background: `linear-gradient(to right, ${community.settings.primaryColor}, ${community.settings.secondaryColor})`
                  }}
                >
                  {typeConfig.ctaText}
                </button>
              </div>
            </div>

            {/* Right image */}
            <div className={`relative ${isMobileView || isTabletView ? 'order-first' : 'order-first lg:order-last'}`}>
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                {community.coverImage ? (
                  <Image
                    src={community.coverImage }
                    alt={community.name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center text-white text-6xl font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${community.settings.primaryColor}, ${community.settings.secondaryColor})`
                    }}
                  >
                    {community.name.charAt(0)}
                  </div>
                )}
                {/* Subtle overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}