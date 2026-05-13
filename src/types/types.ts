export interface Hostel {
    id: string;
    name: string;
    address:Address[];
    phone: string;
    email: string;
    rentRange: {
        min: number;
        max: number;
    };
    totalRooms: number;
    vacanciesAvailable: number;
    roomsAvailable: number;
    totalStudents?: number;
    totalVacancies: number;
    reviews?: Review[];
    totalRevenue?: number;
    totalExpenses?: number;
    totalProfit?: number;
    amenities: Amenities[];
    images: string[];
    rules: Rule[];
    expenses?: Expense[];
    students?: Student[];
    isAcceptingApplications?: boolean;
    notification?: Notification;
    

  }
  export interface Student {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: Address;
    roomNumber: number;
    status: string;
    joinedDate: Date;
    accomodationType: string;
    monthlyRent: number;
    paymentStatus: string;
    payment_due_date: Date;
    paymentHistory: PaymentHistory[];
    applications: Application[];
  }
  export interface Application {
    id: string;
    student: Student;
    hostel: Hostel;
    status: 'pending' | 'approved' | 'rejected';
    date: Date;
  }
  export interface PaymentHistory {
    amount: number;
    date: Date;
  }
  export interface Rule {
    description: string;
  }
  export interface Review {
    rating: number;
    comment: string;
    date: Date;
    publisher: string;
  }
  export interface Amenities {
    name: string;
    available: boolean;
  }
  export interface Address {
    street: string;
    town: string;
    city: string;
  }

  export interface Expense {
    name: string;
    amount: number;
    date: Date;
    description: string;
  }
  export interface Notification {
     message: string;
    date: Date;
  }
