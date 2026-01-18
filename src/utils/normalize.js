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

/**
 * Group sections by semester and year level
 * Sections with codes 101, 301, 501, 701 are 1st semester (odd)
 * Sections with codes 201, 401, 601, 801 are 2nd semester (even)
 */
export const groupSectionsByYearAndSemester = (sections) => {
  const grouped = {
    "1st Semester": {
      "1st Year (101)": [],
      "2nd Year (301)": [],
      "3rd Year (501)": [],
      "4th Year (701)": [],
    },
    "2nd Semester": {
      "1st Year (201)": [],
      "2nd Year (401)": [],
      "3rd Year (601)": [],
      "4th Year (801)": [],
    },
  };

  sections.forEach((section) => {
    if (!section) return;
    
    const code = (section.code || "").toUpperCase().trim();
    const name = section.name || "";
    
    console.log("Processing section:", { code, name, id: section.id });

    // Check for 1st Semester patterns (101, 301, 501, 701)
    if (code.endsWith("101")) {
      grouped["1st Semester"]["1st Year (101)"].push(section);
    } else if (code.endsWith("301")) {
      grouped["1st Semester"]["2nd Year (301)"].push(section);
    } else if (code.endsWith("501")) {
      grouped["1st Semester"]["3rd Year (501)"].push(section);
    } else if (code.endsWith("701")) {
      grouped["1st Semester"]["4th Year (701)"].push(section);
    }
    // Check for 2nd Semester patterns (201, 401, 601, 801)
    else if (code.endsWith("201")) {
      grouped["2nd Semester"]["1st Year (201)"].push(section);
    } else if (code.endsWith("401")) {
      grouped["2nd Semester"]["2nd Year (401)"].push(section);
    } else if (code.endsWith("601")) {
      grouped["2nd Semester"]["3rd Year (601)"].push(section);
    } else if (code.endsWith("801")) {
      grouped["2nd Semester"]["4th Year (801)"].push(section);
    } else {
      // If code doesn't match pattern, add to 1st semester 1st year as fallback
      console.warn("Section code doesn't match expected pattern:", code);
      grouped["1st Semester"]["1st Year (101)"].push(section);
    }
  });

  console.log("Grouped sections result:", grouped);
  return grouped;
};
