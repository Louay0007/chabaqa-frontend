# Video Requirements for Features Section

## Required Videos

Place these MP4 video files in the `/public/videos/` directory:

1. **community-feature.mp4** - Community discussions and engagement
2. **courses-feature.mp4** - Online course interface and learning
3. **challenges-feature.mp4** - Challenges and competitions with leaderboard
4. **products-feature.mp4** - Product marketplace and shopping
5. **coaching-feature.mp4** - 1-on-1 coaching sessions and scheduling
6. **dms-feature.mp4** - Direct messaging and chat interface (NEW)
7. **analytics-feature.mp4** - Analytics dashboard and insights (NEW)
8. **branding-feature.mp4** - Branding customization and themes (NEW)
9. **events-feature.mp4** - Live events and webinars

## Video Specifications

- **Format**: MP4
- **Recommended Resolution**: 1400x1000 or 16:9 aspect ratio
- **Duration**: 10-30 seconds (looping)
- **File Size**: Keep under 5MB for optimal loading
- **Encoding**: H.264 codec recommended
- **Audio**: Not required (videos will be muted)

## Features Added

✅ **Direct Messages (DMs)**
- Color: Green (#10b981)
- Includes: Private chat, Group chat, File sharing

✅ **Analytics & Insights**
- Color: Teal (#14b8a6)
- Includes: Engagement metrics, Revenue tracking, Growth insights

✅ **Branding & Customization**
- Color: Amber (#f59e0b)
- Includes: Custom themes, White label, Brand assets

## UI Improvements

✅ **Desktop Sidebar**
- Reduced width from 320px to 256px (lg:w-64)
- Made scrollable with max-height of 600px
- Added custom thin scrollbar with gray colors
- Sticky positioning for better UX
- Smaller padding and spacing for compact view

✅ **Mobile Horizontal Scroll**
- Added animated scroll indicators on left and right edges
- Vertical bars with pulse animation to indicate scrollability
- Wider gradient fade edges (8px instead of 6px)
- Better visual cue for users to scroll horizontally

## Implementation Notes

- Videos autoplay on loop when feature is selected
- Videos are muted by default
- Smooth transitions between features
- Fallback to placeholder if video not found
