import { IStudent, IStudentWithCollegeCourse } from "../types";
import { saveImage } from "../utils/saveImage";
import { DataStorageService } from "./DataStorageService";

class StudentService {
  dsService: DataStorageService;

  constructor(dsService: DataStorageService) {
    this.dsService = dsService;
  }

  checkCanAddStudent = async (
    _: Electron.IpcMainInvokeEvent
  ): Promise<boolean> => {
    const colleges = this.dsService
      .getDatabase()
      .prepare("SELECT * FROM Colleges")
      .all();

    const courses = this.dsService
      .getDatabase()
      .prepare("SELECT * FROM Courses")
      .all();

    return colleges.length > 0 && courses.length > 0;
  };

  getStudents = async (_: Electron.IpcMainInvokeEvent): Promise<IStudent[]> => {
    console.log("Getting students");

    const students = this.dsService
      .getDatabase()
      .prepare(`SELECT * FROM Students`)
      .all() as IStudent[];

    return students;
  };

  getStudent = async (
    _: Electron.IpcMainInvokeEvent,
    id: string
  ): Promise<IStudentWithCollegeCourse> => {
    const statement = this.dsService
      .getDatabase()
      .prepare<string>(
        "SELECT Students.*, Colleges.name AS collegeName, Colleges.logo AS collegeLogo, Courses.name AS courseName FROM Students INNER JOIN Colleges ON Students.collegeId = Colleges.id INNER JOIN Courses ON Students.courseId = Courses.id WHERE Students.id = ?"
      );

    const student = statement.get(id) as IStudentWithCollegeCourse;

    console.log("Got student", student);

    return student;
  };

  addStudent = async (
    _: Electron.IpcMainInvokeEvent,
    student: IStudent
  ): Promise<IStudent> => {
    console.log("Adding student", student);

    const statement = this.dsService
      .getDatabase()
      .prepare(
        "INSERT INTO Students (id, studentId, firstName, lastName, gender, birthday, photo, collegeId, courseId, year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      );

    this.dsService.createSubDirectoryStorage(student.id);
    await saveImage(student, null, "photo");

    const result = statement.run(
      student.id,
      student.studentId,
      student.firstName,
      student.lastName,
      student.gender,
      student.birthday,
      student.photo,
      student.collegeId,
      student.courseId,
      student.year
    );

    console.log("Added student", result);

    return student;
  };

  updateStudent = async (
    _: Electron.IpcMainInvokeEvent,
    student: IStudent
  ): Promise<IStudent> => {
    console.log("Updating student", student);

    const getStudentStatement = this.dsService
      .getDatabase()
      .prepare("SELECT * FROM Students WHERE id != ?");

    const existingStudent = getStudentStatement.get(student.id) as IStudent;

    await saveImage(existingStudent, student, "photo");

    const statement = this.dsService
      .getDatabase()
      .prepare(
        "UPDATE Students SET studentId = ?, firstName = ?, lastName = ?, gender = ?, birthday = ?, photo = ?, collegeId = ?, courseId = ?, year = ? WHERE id = ?"
      );

    const result = statement.run(
      student.studentId,
      student.firstName,
      student.lastName,
      student.gender,
      student.birthday,
      student.photo,
      student.collegeId,
      student.courseId,
      student.year,
      student.id
    );

    console.log("Updated student", result);

    return student;
  };

  deleteStudent = async (
    _: Electron.IpcMainInvokeEvent,
    id: string
  ): Promise<IStudent> => {
    console.log("Deleting student", id);

    const statement = this.dsService
      .getDatabase()
      .prepare<string>("DELETE FROM Students WHERE id = ?");

    const result = statement.run(id);
    await this.dsService.deleteSubDirectoryStorage(id);

    console.log("Deleted student", result);

    return { id } as IStudent;
  };
}

export { StudentService };
