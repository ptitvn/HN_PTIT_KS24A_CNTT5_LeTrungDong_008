import console = require("console");

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
function ask(question: string): Promise<string> {
  return new Promise<string>((resolve) =>
    rl.question(question, (answer: string) => resolve(answer))
  );
}
class Member {
  static nextId = 1;
  memberId: number;
  name: string;
  contact: string;
  borrowedItems: LibraryItem[] = [];

  constructor(name: string, contact: string) {
    this.memberId = Member.nextId++;
    this.name = name;
    this.contact = contact;
  }

  getDetails(): string {
    return `ID: ${this.memberId}, Name: ${this.name}, Contact: ${this.contact}`;
  }

}
abstract class LibraryItem {
  public id: number;
  protected title: string;
  protected isAvailable: boolean;

  constructor(id: number, title: string) {
    this.id = id;
    this.title = title;
    this.isAvailable = true;
  }

  public get available(): boolean {
    return this.isAvailable;
  }

  public getTitle(): string {
    return this.title;
  }
  borrowItem(): void {
    if (this.isAvailable) {
      this.isAvailable = false;
    } else {
      throw new Error("Item is not available for borrowing.");
    }
  }

  returnItem(): void {
    this.isAvailable = true;
  }

  abstract getLoanPeriod(): number;
  abstract calculateLateFee(daysOverdue: number): number;
  abstract getItemType(): string;
}
class Book extends LibraryItem {
    private author: string;

    constructor(id: number, title: string, author: string) {
        super(id, title);
        this.author = author;
    }

    getLoanPeriod(): number {
        return 30; 
    }

    calculateLateFee(daysOverdue: number): number {
        return daysOverdue * 10000; 
    }

    getItemType(): string {
        return "Sách";
    }
}
class Magazine extends LibraryItem {
    private issueNumber: number;

    constructor(id: number, title: string, issueNumber: number) {
        super(id, title);
        this.issueNumber = issueNumber;
    }

    getLoanPeriod(): number {
        return 7;
    }

    calculateLateFee(daysOverdue: number): number {
        return daysOverdue * 5000; 
    }

    getItemType(): string {
        return "Tạp chí";
    }
}
class Loan {
  static nextId = 1;
  loanId: number;
  member: Member;
  item: LibraryItem;
  dueDate: Date;
  isReturned: boolean | undefined;

constructor(member: Member, item: LibraryItem) {
  this.loanId = Loan.nextId++;
  this.member = member;
  this.item = item;
  this.dueDate = new Date(Date.now() + item.getLoanPeriod() * 24 * 60 * 60 * 1000);
  this.isReturned = false;
}

getDetails(): string {
  return `Loan ID: ${this.loanId}, Member: ${this.member.getDetails()}, Item: ${this.item.getTitle()}, Due Date: ${this.dueDate.toLocaleDateString()}, Returned: ${this.isReturned}`;
}
}

class Library {
    getBorrowedItemsByMember(memberId: number) {
        throw new Error("Method not implemented.");
    }
    items: LibraryItem[] = [];
    members: Member[] = [];
    loans: Loan[] = [];
    
    addItem(item: LibraryItem): void {
        this.items.push(item);
    }
    
    addMember(name: string, contact: string): Member {
        const member = new Member(name, contact);
        this.members.push(member);
        return member;
    }

    // Generic method to find entity by id
    findEntityById<T extends { id?: number; memberId?: number }>(collection: T[], id: number): T | undefined {
        return collection.find(entity => 
            (typeof entity.id === "number" && entity.id === id) ||
            (typeof entity.memberId === "number" && entity.memberId === id)
        );
    }
    
    borrowItem(memberId: number, itemId: number): Loan | null {
        const member = this.findEntityById(this.members, memberId) as Member | undefined;
        const item = this.findEntityById(this.items, itemId) as LibraryItem | undefined;

        if (member && item && item.available) {
            item.borrowItem();
            const loan = new Loan(member, item);
            this.loans.push(loan);
            member.borrowedItems.push(item);
            return loan;
        }
        return null;
    }
    
    returnItem(itemId: number): number {
        const loanIndex = this.loans.findIndex(loan => loan.item.id === itemId && !loan.isReturned);
        if (loanIndex !== -1) {
        const loan = this.loans[loanIndex];
        if (loan) {
            loan.isReturned = true;
            loan.item.returnItem();
            const daysOverdue = Math.max(0, Math.ceil((new Date().getTime() - loan.dueDate.getTime()) / (1000 * 60 * 60 * 24)));
            return loan.item.calculateLateFee(daysOverdue);
        }
        }
        return 0;
    }

    getAvailableItems(): LibraryItem[] {
        return this.items.filter(item => item.available);
    }
    listMemberLoans(memberId: number): void {
        const member = this.findEntityById(this.members, memberId) as Member | undefined;
        if (member) {
            const borrowedItems = member.borrowedItems.filter(item => !item.available);
            console.log(`Danh sách tài liệu đang mượn của thành viên ${memberId}:`);
            borrowedItems.forEach(item => {
                console.log(`- ${item.getTitle()}`);
                
            });
        }
    }
    calculateTotalLateFees(): number {
        return this.loans.reduce((total, loan) => {
            const daysOverdue = Math.max(0, Math.ceil((new Date().getTime() - loan.dueDate.getTime()) / (1000 * 60 * 60 * 24)));
            return total + loan.item.calculateLateFee(daysOverdue);
        }, 0);
    }
    getTotalLateFees(): number {
        return this.loans.reduce((total, loan) => {
            if (loan.isReturned) {
                const daysOverdue = Math.max(0, Math.ceil((new Date().getTime() - loan.dueDate.getTime()) / (1000 * 60 * 60 * 24)));
                return total + loan.item.calculateLateFee(daysOverdue);
            }
            return total;
        }, 0);
    }


}
async function getUserInput(prompt: string): Promise<string> {
    const input = await ask(prompt);
    return input.trim();
}

async function main() {
    const library = new Library();
    let choice: number = 0;

    do{
        console.log(`
            1. thêm thành viên mới
            2. thêm tài liệu mới (chọn loại: sách,Tạp chí)
            3.Mượn tài liệu (Chọn thành viên, chọn tài liệu)
            4. Trả tài liệu(Hiển thị phí phạt nếu có)
            5. Hiển thị danh sách tài liệu có sẵn(sử dụng filter)
            6. Hiển thị danh sách tài liệu đang mượn của một thành viên (sử dụng filter)
            7. tính và hiển thị tổng phí phạt đã thu(sử dụng reduce)
            8. thống kê số lượng từng loại tài liệu (sử dụng reduce hoặc map)
            9. cập nhật tiêu đề một tài liệu (sử dụng findIndex)
            10.tìm kiếm thành viên hoặc tài liệu thoe ID(sử dụng hàm generic đã tạo)
            11 thoát chương trình
        `);
        choice = parseInt(await getUserInput("Chọn một tùy chọn: "));
        
        switch (choice) {
            case 1:
                // Thêm thành viên mới
               const memberName = await getUserInput("Nhập tên thành viên: ");
               const memberContact = await getUserInput("Nhập thông tin liên hệ: ");
               const newMember = library.addMember(memberName, memberContact);
               console.log(`Đã thêm thành viên mới: ${newMember.name} (ID: ${newMember.memberId})`);
                break;
            case 2:
                // Thêm tài liệu mới
                const itemTitle = await getUserInput("Nhập tiêu đề tài liệu: ");
                const itemType = await getUserInput("Nhập loại tài liệu (sách/tạp chí): ");
                let newItem: LibraryItem | undefined;
                if (itemType.toLowerCase() === "sách") {
                    const itemAuthor = await getUserInput("Nhập tác giả tài liệu: ");
                    newItem = new Book(library.items.length + 1, itemTitle, itemAuthor);
                } else if (itemType.toLowerCase() === "tạp chí") {
                    const issueNumber = parseInt(await getUserInput("Nhập số phát hành: "));
                    newItem = new Magazine(library.items.length + 1, itemTitle, issueNumber);
                } else {
                    console.log("Loại tài liệu không hợp lệ.");
                }
                if (newItem) {
                    library.addItem(newItem);
                    console.log(`Đã thêm tài liệu mới: ${newItem.getTitle()} (ID: ${newItem.id})`);
                }
                break;
            case 3:
                // Mượn tài liệu
                if (library.items.length === 0) {
                    const itemTitle = await getUserInput("Nhập tiêu đề tài liệu: ");
                }
               const itemId = parseInt(await getUserInput("Nhập ID tài liệu: "));
               const loan = library.borrowItem(parseInt(await getUserInput("Nhập ID thành viên: ")), itemId);
               if (loan) {
                   console.log(`Đã mượn tài liệu: ${loan.item.getTitle()} (ID: ${loan.loanId})`);
               } else {
                   console.log("Không thể mượn tài liệu.");
               }
                break;
            case 4:
                // Trả tài liệu
                const returnItemId = parseInt(await getUserInput("Nhập ID tài liệu cần trả: "));
                const returnLoan = library.returnItem(returnItemId);
                if (returnLoan) {
                    console.log(`Đã trả tài liệu. Phí phạt (nếu có): ${returnLoan} đồng`);
                } else {
                    console.log("Không thể trả tài liệu.");
                }
                break;
            case 5:
                // Hiển thị danh sách tài liệu có sẵn
                const availableItems = library.getAvailableItems();
                if (availableItems.length > 0) {
                    console.log("Danh sách tài liệu có sẵn:");
                    availableItems.forEach(item => {
                        console.log(`- ${item.getTitle()} (ID: ${item.id})`);
                    });
                } else {
                    console.log("Không có tài liệu nào có sẵn.");
                }
                break;
            case 6:
                // Hiển thị danh sách tài liệu đang mượn của một thành viên
                const memberId = parseInt(await getUserInput("Nhập ID thành viên: "));
                const borrowedItems = library.getBorrowedItemsByMember(memberId);
                // if (borrowedItems.length > 0) {
                //     console.log(`Danh sách tài liệu đang mượn của thành viên (ID: ${memberId}):`);
                //     borrowedItems.forEach((item: { getTitle: () => any; id: any; }) => {
                //         console.log(`- ${item.getTitle()} (ID: ${item.id})`);
                //     });
                // } else {
                //     console.log("Thành viên này không mượn tài liệu nào.");
                // }
                break;
            case 7:
                // Tính và hiển thị tổng phí phạt đã thu
                const totalLateFees = library.getTotalLateFees();
                console.log(`Tổng phí phạt đã thu: ${totalLateFees} đồng`);
                break;
            case 8:
                // Thống kê số lượng từng loại tài liệu
                break;
            case 9:
                // Cập nhật tiêu đề một tài liệu
                break;
            case 10:
                // Tìm kiếm thành viên hoặc tài liệu theo ID
                break;
            case 11:
                console.log("Thoát chương trình");
                break;
            default:
                console.log("Lựa chọn không hợp lệ");
        }

    }while (choice !== 11)
}
main().catch((error) => {
    console.error("Đã xảy ra lỗi:", error);
}).finally(() => {
    rl.close();
});