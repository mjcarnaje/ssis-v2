import { ICourse } from "../types";
import { DataStorageService } from "./DataStorageService";

class CourseService {
  dsService: DataStorageService;

  constructor(dsService: DataStorageService) {
    this.dsService = dsService;
  }

  getCourses = async (_: Electron.IpcMainInvokeEvent): Promise<ICourse[]> => {
    const statement = this.dsService
      .getDatabase()
      .prepare("SELECT * FROM Courses");

    const courses = statement.all() as ICourse[];

    return courses;
  };

  addCourse = async (_: Electron.IpcMainInvokeEvent, course: ICourse) => {
    const statement = this.dsService
      .getDatabase()
      .prepare(
        "INSERT INTO Courses (id, name, abbreviation, description, collegeId) VALUES (?, ?, ?, ?, ?)"
      );

    statement.run(
      course.id,
      course.name,
      course.abbreviation,
      course.description,
      course.collegeId
    );

    return course;
  };

  updateCourse = async (
    _: Electron.IpcMainInvokeEvent,
    course: ICourse
  ): Promise<ICourse> => {
    const statement = this.dsService
      .getDatabase()
      .prepare(
        "UPDATE Courses SET name = ?, abbreviation = ?, description = ?, collegeId = ?, WHERE id = ?"
      );

    statement.run(
      course.name,
      course.abbreviation,
      course.description,
      course.collegeId,
      course.id
    );

    return course;
  };

  deleteCourse = async (
    _: Electron.IpcMainInvokeEvent,
    id: string
  ): Promise<ICourse> => {
    try {
      const statement = this.dsService
        .getDatabase()
        .prepare<string>("DELETE FROM Courses WHERE id = ?");

      statement.run(id);

      return { id } as ICourse;
    } catch (err) {
      if (err.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
        throw new Error("You cannot delete a course that has students");
      }
      throw err;
    }
  };
}

export { CourseService };
