/* 輸入 Type */
export type BillInput = {
  date: string
  location: string
  tipPercentage: number
  items: BillItem[]
}

type BillItem = SharedBillItem | PersonalBillItem

type CommonBillItem = {
  price: number
  name: string
}

type SharedBillItem = CommonBillItem & {
  isShared: true
}

type PersonalBillItem = CommonBillItem & {
  isShared: false
  person: string
}

/* 輸出 Type */
export type BillOutput = {
  date: string
  location: string
  subTotal: number
  tip: number
  totalAmount: number
  items: PersonItem[]
}

type PersonItem = {
  name: string
  amount: number
}

/* 核心函數 */
export function splitBill(input: BillInput): BillOutput {
  let date = formatDate(input.date)
  let location = input.location
  let subTotal = calculateSubTotal(input.items)
  let tip = calculateTip(subTotal, input.tipPercentage)
  let totalAmount = subTotal + tip
  let items = calculateItems(input.items, input.tipPercentage)
  adjustAmount(totalAmount, items)
  return {
    date,
    location,
    subTotal,
    tip,
    totalAmount,
    items,
  }
}

// input format: YYYY-MM-DD, e.g. "2024-03-21"
// output format: YYYY年M月D日, e.g. "2024年3月21日" 

function formatDate(date: string): string {
  
    // Split the input date
  let [year, month, day] = date.split('-');
    
  let dateObj = new Date(date);
  month = (dateObj.getMonth() + 1).toString();
  day = (dateObj.getDate().toString());

  // Construct the formatted date string
  return `${year}年${month}月${day}日`;
  }

  // sum up all the price of the items
  export function calculateSubTotal(items: BillItem[]): number {
    // 使用 reduce 方法來累加所有項目的價格
    return items.reduce((total, item) => total + item.price, 0);
  }


  // output round to closest 10 cents, e.g. 12.34 -> 12.3
export function calculateTip(subTotal: number, tipPercentage: number): number {
  // 計算小費
  const tip = (subTotal * tipPercentage) / 100;
  
  // 四捨五入至最近的 $0.1 元
  return Math.round(tip * 10) / 10;
}


  // scan the persons in the items

function scanPersons(items: BillItem[]): string[] {
  const persons = new Set<string>(); // 使用 Set 以避免重複

  // 遍歷所有項目，收集用餐者的名字
  items.forEach(item => {
    if (!item.isShared) {
      persons.add(item.person);
    }
  });

  return Array.from(persons); // 將 Set 轉換為陣列
}

function calculateItems(
  items: BillItem[],
  tipPercentage: number,
): PersonItem[] {
  let names = scanPersons(items)
  let persons = names.length
  return names.map(name => ({
    name,
    amount: calculatePersonAmount({
      items,
      tipPercentage,
      name,
      persons,
    }),
  }))
}

function calculatePersonAmount(input: {
  items: BillItem[];
  tipPercentage: number;
  name: string;
  persons: number;
}): number {
  let amount = 0;

  // 所有項目，計算個別金額
  input.items.forEach(item => {
    if (item.isShared) {
      // 對於均分的項目，計算每個人應付的金額
      amount += item.price / input.persons;
    } else if (item.person === input.name) {
      // 對於個人項目，僅計算該用餐者的金額
      amount += item.price;
    }
  });

  // 計算小費
  const tip = (amount * input.tipPercentage) / 100;

  // 將小費加到總金額中
  amount += tip;

  // 四捨五入至最近 $0.1 元
  return Math.round(amount * 10) / 10;
}



function adjustAmount(totalAmount: number, items: PersonItem[]): void {
  // 計算當前金額的總和
  const currentTotal = items.reduce((sum, item) => sum + item.amount, 0);
  
  // 計算需要調整的金額
  const adjustment = totalAmount - currentTotal;

  // 如果沒有需要調整的金額，則直接返回
  if (adjustment === 0) return;

  // 找到金額最高的用餐者，若金額相同則選擇第一位
  const maxItem = items.reduce((prev, current) => {
    if (current.amount > prev.amount) {
      return current;
    }
    return prev; // 保持 prev 不變，如果相等則返回 prev
  });

  // 如果需要調整的金額是正數，則向上調整 0.1 元
  if (adjustment > 0) {
    maxItem.amount += 0.1; // 向上調整 0.1 元
  } else {
    // 向下調整，根據需要的調整金額進行調整
    maxItem.amount += adjustment;
  }

  // 四捨五入至最近 $0.1 元
  maxItem.amount = Math.round(maxItem.amount * 10) / 10;
}