export interface CourseItem { code: string; name: string; department?: string }

export async function listCourses(department?: string): Promise<CourseItem[]> {
  try {
    const url = new URL('http://localhost:5000/api/courses');
    if (department) url.searchParams.set('department', department);
    const res = await fetch(url.toString(), { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch courses');
    const data = await res.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    return items as CourseItem[];
  } catch (e) {
    return [];
  }
}