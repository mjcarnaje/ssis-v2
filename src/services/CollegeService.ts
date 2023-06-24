import { ICollege, ICollegeWithCourses, ICourse } from "../types";
import { DataStorageService } from "./DataStorageService";

class CollegeService {
  dsService: DataStorageService;

  constructor(dsService: DataStorageService) {
    this.dsService = dsService;
  }

  getColleges = async (_: Electron.IpcMainInvokeEvent): Promise<ICollege[]> => {
    const colleges = this.dsService
      .getDatabase()
      .prepare(`SELECT * FROM Colleges`)
      .all() as ICollege[];

    return colleges;
  };

  getCollegeCourses = async (
    _: Electron.IpcMainInvokeEvent,
    collegeId: string
  ): Promise<ICourse[]> => {
    const statement = this.dsService
      .getDatabase()
      .prepare<string>(`SELECT * FROM Courses WHERE collegeId = ?`);

    const courses = statement.all(collegeId) as ICourse[];

    return courses;
  };

  getCollegesWithCourses = async (
    _: Electron.IpcMainInvokeEvent
  ): Promise<ICollegeWithCourses[]> => {
    const collegesStatement = this.dsService
      .getDatabase()
      .prepare(`SELECT * FROM Colleges`);

    const colleges = collegesStatement.all() as ICollege[];

    const coursesStatement = this.dsService
      .getDatabase()
      .prepare(`SELECT * FROM Courses`);

    const courses = coursesStatement.all() as ICourse[];

    const collegesWithCourses = colleges.map((college) => {
      const collegeCourses = courses.filter(
        (course) => course.collegeId === college.id
      );

      return {
        ...college,
        courses: collegeCourses,
      } as ICollegeWithCourses;
    });

    return collegesWithCourses;
  };

  addCollege = async (_: Electron.IpcMainInvokeEvent, college: ICollege) => {
    console.log("Adding college", college);

    const statement = this.dsService
      .getDatabase()
      .prepare(
        "INSERT INTO Colleges (id, name, abbreviation, logo) VALUES (?, ?, ?, ?)"
      );

    const result = statement.run(
      college.id,
      college.name,
      college.abbreviation,
      college.logo
    );

    this.dsService.createSubDirectoryStorage(college.id);
    console.log("Added college", result);

    return college;
  };

  updateCollege = async (
    _: Electron.IpcMainInvokeEvent,
    college: ICollege
  ): Promise<ICollege> => {
    const statement = this.dsService
      .getDatabase()
      .prepare(
        `UPDATE Colleges SET name = ?, logo = ?, abbreviation = ?, WHERE id = ?`
      );

    statement.run(college.name, college.logo, college.abbreviation, college.id);

    return college;
  };

  deleteCollege = async (
    _: Electron.IpcMainInvokeEvent,
    id: string
  ): Promise<ICollege> => {
    try {
      console.log("Deleting college", id);

      const statement = this.dsService
        .getDatabase()
        .prepare(`DELETE FROM Colleges WHERE id = ?`);

      const result = statement.run(id);

      await this.dsService.deleteSubDirectoryStorage(id);

      console.log("Deleted college", result);

      return { id } as ICollege;
    } catch (err) {
      if (err.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
        throw new Error(
          "You cannot delete a college that has students or courses"
        );
      }

      throw err;
    }
  };
}

export { CollegeService };
