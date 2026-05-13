import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import "reflect-metadata";

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  street!: string;

  @Column()
  town!: string;

  @Column()
  city!: string;

  @ManyToOne(() => Hostel, (hostel: Hostel) => hostel.addresses)
  hostel!: Hostel;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  rating!: number;

  @Column()
  comment!: string;

  @Column()
  date!: Date;

  @Column()
  publisher!: string;

  @ManyToOne(() => Hostel, (hostel: Hostel) => hostel.reviews)
  hostel!: Hostel;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('amenities')
export class Amenity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  available!: boolean;

  @ManyToOne(() => Hostel, (hostel: Hostel) => hostel.amenities)
  hostel!: Hostel;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('rules')
export class Rule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  description!: string;

  @ManyToOne(() => Hostel, (hostel: Hostel) => hostel.rules)
  hostel!: Hostel;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  amount!: number;

  @Column()
  date!: Date;

  @Column()
  description!: string;

  @ManyToOne(() => Hostel, (hostel: Hostel) => hostel.expenses)
  hostel!: Hostel;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('payment_histories')
export class PaymentHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  amount!: number;

  @Column()
  date!: Date;

  @ManyToOne(() => Student, (student: Student) => student.paymentHistory)
  student!: Student;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Student, (student: Student) => student.applications)
  student!: Student;

  @ManyToOne(() => Hostel, (hostel: Hostel) => hostel.applications)
  hostel!: Hostel;

  @Column()
  status!: 'pending' | 'approved' | 'rejected';

  @Column()
  date!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column()
  phone!: string;

  @Column('jsonb')
  address!: {
    street: string;
    town: string;
    city: string;
  };

  @Column()
  roomNumber!: number;

  @Column()
  status!: string;

  @Column()
  joinedDate!: Date;

  @Column()
  leaveDate!: Date;

  @Column()
  accomodationType!: string;

  @Column()
  monthlyRent!: number;

  @Column()
  paymentStatus!: string;

  @Column()
  payment_due_date!: Date;

  @OneToMany(() => PaymentHistory, (paymentHistory: PaymentHistory) => paymentHistory.student)
  paymentHistory!: PaymentHistory[];

  @ManyToOne(() => Hostel, (hostel: Hostel) => hostel.students)
  hostel!: Hostel;

  @OneToMany(() => Application, (application: Application) => application.student)
  applications!: Application[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('hostels')
export class Hostel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @OneToMany(() => Address, (address: Address) => address.hostel)
  addresses!: Address[];

  @Column()
  phone!: string;

  @Column()
  email!: string;

  @Column()
  password!: string;

  @Column('jsonb')
  rentRange!: {
    min: number;
    max: number;
  };

  @Column()
  totalRooms!: number;

  @Column()
  vacanciesAvailable!: number;

  @Column()
  roomsAvailable!: number;

  @Column({ nullable: true })
  totalStudents?: number;

  @Column()
  totalVacancies!: number;

  @OneToMany(() => Review, (review: Review) => review.hostel)
  reviews?: Review[];

  @Column({ nullable: true })
  totalRevenue?: number;

  @Column({ nullable: true })
  totalExpenses?: number;

  @Column({ nullable: true })
  notification?: Notification;

  @Column({ nullable: true })
  totalProfit?: number;

  @OneToMany(() => Amenity, (amenity: Amenity) => amenity.hostel)
  amenities!: Amenity[];

  @Column('text', { array: true })
  images!: string[];

  @OneToMany(() => Rule, (rule: Rule) => rule.hostel)
  rules!: Rule[];

  @OneToMany(() => Expense, (expense: Expense) => expense.hostel)
  expenses?: Expense[];

  @OneToMany(() => Student, (student: Student) => student.hostel)
  students?: Student[];

  @OneToMany(() => Application, (application: Application) => application.hostel)
  applications!: Application[];

  @Column({ default: true })
  isAcceptingApplications!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
