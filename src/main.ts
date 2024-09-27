import { courses } from './data';
import { Timetable, SectionRaw, TimeSlot, Instructor, CourseRaw } from './types';

export function generateLectureTimetables(codes: string[]): Timetable[] {
  //   let timetables: Timetable[] = [];
  if (codes.some((code) => !(code in courses))) {
    console.log('yo u messed up a course code');
  }

  const lectureSections: SectionRaw[][] = codes.map((code: string) => {
    return courses[code].sections.filter((section: SectionRaw) => {
      return section.type === 'Lecture';
    });
  });

  const lengths: number[] = lectureSections.map((lectures) => lectures.length);

  const lectureCombinations: Timetable[] = getCombinations(lectureSections);
  console.log('Unfiltered lecture combinations: ' + lectureCombinations.length);
  const filteredCombinations: Timetable[] = lectureCombinations.filter((timetable: Timetable) => {
    return !hasConflictInTimetable(timetable);
  });
  console.log('Filtered conflicts out combinations: ' + filteredCombinations.length);

  return filteredCombinations.filter((timetable: Timetable) => {
    return validCourseLimit(timetable);
  });
}

function validCourseLimit(timetable: Timetable, limit: number = 5): boolean {
  let fall: number = timetable.filter((section: SectionRaw) => {
    return section.sectionCode === 'F' || section.sectionCode === 'Y';
  }).length;
  let winter: number = timetable.filter((section: SectionRaw) => {
    return section.sectionCode === 'S' || section.sectionCode === 'Y';
  }).length;

  return fall <= limit && winter <= limit;
}

// --------------------------------------------------------------------------------------------------------------------

export function getCombinations(sections: SectionRaw[][]): Timetable[] {
  const allCombinations: SectionRaw[][] = [];
  getCombinationsRecursive(sections, 0, [], allCombinations);
  return allCombinations as Timetable[];
}

export function getCombinationsRecursive(
  sections: SectionRaw[][],
  i: number,
  currentCombination: SectionRaw[],
  allCombinations: SectionRaw[][]
) {
  if (i === sections.length) {
    allCombinations.push(currentCombination);
  } else {
    for (const section of sections[i]) {
      getCombinationsRecursive(sections, i + 1, currentCombination.concat(section), allCombinations);
    }
  }
}

// --------------------------------------------------------------------------------------------------------------------

// it should only be a conflict if its the same session
export function hasConflictInTimetable(timetable: Timetable, timeFilters: TimeSlot[] = []): boolean {
  for (let i = 0; i < timetable.length; i++) {
    if (hasTimeConflict(timeFilters, timetable[i].meetingTimes)) {
      return true;
    }

    for (let j = i + 1; j < timetable.length; j++) {
      if (
        overlappingSession(timetable[i], timetable[j]) &&
        hasTimeConflict(timetable[i].meetingTimes, timetable[j].meetingTimes)
      ) {
        return true;
      }
    }
  }
  return false;
}

export function overlappingSession(sectionA: SectionRaw, sectionB: SectionRaw) {
  const a: string = sectionA.sectionCode;
  const b: string = sectionB.sectionCode;

  // All overlapping section codes
  if ((a === 'F' && b === 'F') || (a === 'S' && b === 'S')) {
    return true;
  }
  if ((a === 'F' && b === 'Y') || (a === 'Y' && b === 'F')) {
    return true;
  }
  if ((a === 'S' && b === 'Y') || (a === 'Y' && b === 'S')) {
    return true;
  }
  if (a === 'Y' && b === 'Y') {
    return true;
  }

  return false;
}

export function hasTimeConflict(timesA: TimeSlot[], timesB: TimeSlot[]): boolean {
  for (const timeA of timesA) {
    for (const timeB of timesB) {
      if (hasTimeOverlap(timeA, timeB)) {
        return true;
      }
    }
  }
  return false;
}

export function hasTimeOverlap(timeA: TimeSlot, timeB: TimeSlot) {
  const sameDay: boolean = timeA.start.day === timeB.start.day;
  const overlapTime: boolean =
    Math.max(timeA.start.millisofday, timeB.start.millisofday) < Math.min(timeA.end.millisofday, timeB.end.millisofday);

  return sameDay && overlapTime;
}

// --------------------------------------------------------------------------------------------------------------------

// Filter by instructor. This part is not tested... hopefully it works lol.

export function filterInstructors(timetables: Timetable[], instructors: { [courseCode: string]: Instructor[] }): Timetable[] {
  return timetables.filter((timetable: Timetable) => {
    return timetable.every((section: SectionRaw) => {
      return validInstructors(section, instructors);
    });
  });
}

export function validInstructors(section: SectionRaw, instructors: { [courseCode: string]: Instructor[] }): boolean {
  if (!(section.courseCode in instructors)) {
    // No instructors chosen implies any instructor is okay
    return true;
  }

  return section.instructors.some((instructor: Instructor) => {
    return instructors[section.courseCode].includes(instructor);
  });
}

// --------------------------------------------------------------------------------------------------------------------

// Add valid practicals and tutorials

// IMPORTANT NOTE: too many combinations => run out of heap space
// best workaround for now is to simply generate periodically
// e.g. a generate 10 timetables button for ex
export function addTutorialsAndPracticals(timetables: Timetable[]): Timetable[] {
  const allTimetables: Timetable[] = [];

  for (const timetable of timetables) {
    addTutorialsAndPracticalsRecursive(timetable, 0, timetable, allTimetables);
  }

  return allTimetables;
  // return allTimetables.filter((timetable: Timetable) => {
  //   return !hasConflictInTimetable(timetable);
  // });
}

export function addTutorialsAndPracticalsRecursive(
  timetable: Timetable,
  i: number,
  currentCombination: Timetable,
  allCombinations: Timetable[]
) {
  if (hasConflictInTimetable(currentCombination)) {
    return;
  }
  if (i === timetable.length) {
    allCombinations.push(currentCombination);
    return;
  }

  const section: SectionRaw = timetable[i];
  const tutorials: SectionRaw[] = courses[section.courseCode].sections.filter((s: SectionRaw) => {
    return s.type === 'Tutorial';
  });
  const practicals: SectionRaw[] = courses[section.courseCode].sections.filter((s: SectionRaw) => {
    return s.type === 'Practical';
  });

  if (tutorials.length === 0 && practicals.length === 0) {
    addTutorialsAndPracticalsRecursive(timetable, i + 1, currentCombination, allCombinations);
  } else if (tutorials.length === 0) {
    // Practicals only
    for (const practical of getFilteredLabs(section, practicals)) {
      addTutorialsAndPracticalsRecursive(timetable, i + 1, currentCombination.concat(practical), allCombinations);
    }
  } else if (practicals.length === 0) {
    // Tutorials only
    for (const tutorial of getFilteredLabs(section, tutorials)) {
      addTutorialsAndPracticalsRecursive(timetable, i + 1, currentCombination.concat(tutorial), allCombinations);
    }
  } else {
    // Both tutorials and practicals
    for (const tutorial of getFilteredLabs(section, tutorials)) {
      for (const practical of getFilteredLabs(section, practicals)) {
        addTutorialsAndPracticalsRecursive(timetable, i + 1, currentCombination.concat(tutorial, practical), allCombinations);
      }
    }
  }
}

function getFilteredLabs(lecture: SectionRaw, labs: SectionRaw[]): SectionRaw[] {
  return labs.filter((lab: SectionRaw) => {
    return (
      lecture.sectionCode === lab.sectionCode &&
      (lab.linkedMeetingSections === null || lab.linkedMeetingSections.some((e) => e.sectionNumber === lecture.sectionNumber))
    );
  });
}

// --------------------------------------------------------------------------------------------------------------------

import fs from 'fs';

console.log('Starting.');

let timetables: Timetable[] = generateLectureTimetables([
  'CSC209H1',
  'CSC258H1',
  'CSC300H1',
  'CSC343H1',
  'STA257H1',
  'CSC263H1',
  'CSC311H1',
  'POL101H1',
  'STA261H1',
  'CSC369H1',
]);

console.log('Number of generated timetables:', timetables.length);

console.log('Writing to file.');

let transformedJson = JSON.stringify(timetables);
fs.writeFile('firstTest.json', transformedJson, (err) => {
  if (err) {
    console.log('Error writing file:', err);
  } else {
    console.log('Successfully wrote file');
  }
});
