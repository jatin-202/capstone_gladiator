import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class PaymentService {

    private baseUrl = 'https://orchardsolvemb76.lntedutech.com/project/7484/proxy/3000/payment';

    constructor(private http: HttpClient) { }

    createOrder(amount: number) {
        return this.http.post(`${this.baseUrl}/create-order`, { amount });
    }

    verifyPayment(data: any) {
        return this.http.post(`${this.baseUrl}/verify`, data);
    }
}
