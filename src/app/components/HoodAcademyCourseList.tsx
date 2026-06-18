import { ACADEMY_FEATURED_COURSES } from '@/lib/academyFeaturedCourses';

export function HoodAcademyCourseList() {
  return (
    <div
      className="hood-tire-hub__product-list-viewport hood-tire-hub__course-list-viewport"
      tabIndex={0}
      role="region"
      aria-label="Featured Academy courses"
    >
      <ul className="hood-tire-hub__course-list">
        {ACADEMY_FEATURED_COURSES.map((course) => (
          <li key={course} className="hood-tire-hub__course-list-item">
            {course}
          </li>
        ))}
      </ul>
    </div>
  );
}
