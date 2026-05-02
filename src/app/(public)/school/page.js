import { GraduationCap } from 'lucide-react';
import prisma from '@/lib/prisma';
import CourseList from './_components/course-list';

export const metadata = {
  title: 'Школа — Hair Atelier',
  description: 'Обучение от практикующих мастеров салона. Делимся техниками и секретами, которые используем каждый день.',
};

export default async function SchoolPage() {
  let courses = [];
  try {
    courses = await prisma.course.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    courses = courses.map((c) => ({
      ...c,
      startDate: c.startDate ? c.startDate.toISOString() : null,
      endDate: c.endDate ? c.endDate.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  } catch (e) {
    console.error('SchoolPage prisma fetch failed:', e);
  }

  return (
    <div className="section-padding py-10 md:py-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 md:mb-14">
          <span className="text-xs tracking-[0.2em] uppercase text-gold-500 font-body block mb-3">
            Обучение
          </span>
          <h1 className="heading-lg text-charcoal-900 mb-4">Школа Hair Atelier</h1>
          <p className="body-text max-w-lg">
            Обучение от практикующих мастеров салона. Делимся техниками
            и секретами, которые используем каждый день.
          </p>
        </div>

        {courses.length > 0 ? (
          <CourseList courses={courses} />
        ) : (
          <div className="text-center py-20">
            <GraduationCap size={48} className="mx-auto text-cream-300 mb-4" />
            <p className="text-charcoal-500">Курсы скоро появятся</p>
          </div>
        )}
      </div>
    </div>
  );
}
