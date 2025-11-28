export const normalizePost = (p) => ({
  post_id: p.POST_ID ?? p.post_id ?? p.postId,
  post_content: p.POST_CONTENT ?? p.post_content ?? p.postContent,
  posted_date: p.POSTED_DATE ?? p.posted_date ?? p.postedDate,
  category_name: p.CATEGORY_NAME ?? p.category_name ?? p.categoryName,
  section_name: p.SECTION_NAME ?? p.section_name ?? p.sectionName,
  organization: p.ORGANIZATION ?? p.organization,
  posted_by: p.POSTED_BY ?? p.posted_by ?? p.postedBy
});

export const normalizeCategory = (c) => ({
  category_id: c.CATEGORY_ID ?? c.category_id ?? c.categoryId,
  category_name: c.CATEGORY_NAME ?? c.category_name ?? c.categoryName
});
