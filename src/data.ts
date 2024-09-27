import courseData from '../data/courseData.json';
import { CourseRaw } from './types';

export const courses: Record<string, CourseRaw> = courseData as Record<
  string,
  CourseRaw
>;
