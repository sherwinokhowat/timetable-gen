export interface TimeSlot {
  start: {
    day: number;
    millisofday: number;
  };
  end: {
    day: number;
    millisofday: number;
  };
}

export interface MeetingTime extends TimeSlot {
  building: {
    buildingCode: string | null;
    buildingUrl: string | null;
  };
  repetition: string;
}

export interface Instructor {
  firstName: string;
  lastName: string;
}

export interface SectionRaw {
  name: string;
  type: string;
  sectionNumber: string;
  meetingTimes: MeetingTime[];
  instructors: Instructor[];
  currentEnrolment: number;
  maxEnrolment: number;
  currentWaitlist: number;
  linkedMeetingSections:
    | {
        teachMethod: string;
        sectionNumber: string;
      }[]
    | null;
  courseCode: string;
  sectionCode: string;
}

export interface CourseRaw {
  name: string;
  code: string;
  campus: string;
  sections: SectionRaw[];
  cmCourseInfo: {
    description: string;
    title: string;
  } | null;
  breadths: {
    breadthTypes: {
      code: string;
    }[];
  }[];
}

export type Timetable = SectionRaw[];
