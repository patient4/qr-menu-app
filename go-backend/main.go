package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/rs/cors"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Database Models
type Restaurant struct {
	ID                 uint      `json:"id" gorm:"primaryKey"`
	Name               string    `json:"name" gorm:"not null"`
	Slug               string    `json:"slug" gorm:"unique;not null"`
	Description        *string   `json:"description"`
	Address            *string   `json:"address"`
	Phone              *string   `json:"phone"`
	Email              *string   `json:"email"`
	Logo               *string   `json:"logo"`
	PrimaryColor       string    `json:"primaryColor" gorm:"default:#FF6B35"`
	SecondaryColor     string    `json:"secondaryColor" gorm:"default:#C62828"`
	AccentColor        string    `json:"accentColor" gorm:"default:#FFB300"`
	TableCount         int       `json:"tableCount" gorm:"default:15"`
	ServiceCharge      string    `json:"serviceCharge" gorm:"default:10.00"`
	GST                string    `json:"gst" gorm:"default:5.00"`
	OrderModes         []string  `json:"orderModes" gorm:"type:text[]"`
	IsActive           bool      `json:"isActive" gorm:"default:true"`
	TrialStartDate     time.Time `json:"trialStartDate" gorm:"default:CURRENT_TIMESTAMP"`
	SubscriptionEndDate *time.Time `json:"subscriptionEndDate"`
	PlanType           string    `json:"planType" gorm:"default:trial"`
	MonthlyRate        string    `json:"monthlyRate" gorm:"default:4999.00"`
	CreatedAt          time.Time `json:"createdAt"`
	UpdatedAt          time.Time `json:"updatedAt"`
}

type MenuCategory struct {
	ID           uint   `json:"id" gorm:"primaryKey"`
	RestaurantID uint   `json:"restaurantId"`
	Name         string `json:"name" gorm:"not null"`
	DisplayOrder int    `json:"displayOrder" gorm:"default:0"`
	CreatedAt    time.Time `json:"createdAt"`
}

type MenuItem struct {
	ID              uint   `json:"id" gorm:"primaryKey"`
	RestaurantID    uint   `json:"restaurantId"`
	CategoryID      uint   `json:"categoryId"`
	Name            string `json:"name" gorm:"not null"`
	Description     *string `json:"description"`
	Price           string `json:"price" gorm:"not null"`
	ImageURL        *string `json:"imageUrl"`
	IsVeg           bool   `json:"isVeg" gorm:"default:true"`
	IsPopular       bool   `json:"isPopular" gorm:"default:false"`
	IsAvailable     bool   `json:"isAvailable" gorm:"default:true"`
	PreparationTime *int   `json:"preparationTime" gorm:"default:15"`
	DisplayOrder    int    `json:"displayOrder" gorm:"default:0"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

type OrderItem struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Price    string `json:"price"`
	Quantity int    `json:"quantity"`
	Total    string `json:"total"`
}

type Order struct {
	ID           uint        `json:"id" gorm:"primaryKey"`
	RestaurantID uint        `json:"restaurantId"`
	OrderNumber  string      `json:"orderNumber" gorm:"unique;not null"`
	OrderType    string      `json:"orderType" gorm:"not null"`
	TableNumber  *string     `json:"tableNumber"`
	CustomerName *string     `json:"customerName"`
	CustomerPhone *string    `json:"customerPhone"`
	Items        []OrderItem `json:"items" gorm:"type:jsonb"`
	Subtotal     string      `json:"subtotal" gorm:"not null"`
	ServiceCharge string     `json:"serviceCharge" gorm:"not null"`
	GST          string      `json:"gst" gorm:"not null"`
	Total        string      `json:"total" gorm:"not null"`
	Status       string      `json:"status" gorm:"default:pending"`
	Notes        *string     `json:"notes"`
	CreatedAt    time.Time   `json:"createdAt"`
	UpdatedAt    time.Time   `json:"updatedAt"`
}

// WebSocket connections
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var clients = make(map[*websocket.Conn]bool)
var broadcast = make(chan []byte)

var db *gorm.DB

func main() {
	initDB()
	go handleMessages()

	router := mux.NewRouter()
	router.HandleFunc("/ws", handleWebSocket)
	
	api := router.PathPrefix("/api").Subrouter()
	
	// Restaurant routes
	api.HandleFunc("/restaurants", getRestaurants).Methods("GET")
	api.HandleFunc("/restaurants", createRestaurant).Methods("POST")
	api.HandleFunc("/restaurants/{id:[0-9]+}", updateRestaurant).Methods("PATCH")
	api.HandleFunc("/restaurant/{id:[0-9]+}", getRestaurant).Methods("GET")
	api.HandleFunc("/restaurant/{id:[0-9]+}/upgrade", upgradeRestaurant).Methods("POST")
	api.HandleFunc("/restaurant/{id:[0-9]+}/categories", getMenuCategories).Methods("GET")
	api.HandleFunc("/restaurant/{id:[0-9]+}/menu", getMenuItems).Methods("GET")
	api.HandleFunc("/restaurant/{id:[0-9]+}/orders", getOrders).Methods("GET")
	api.HandleFunc("/restaurant/{id:[0-9]+}/stats", getStats).Methods("GET")
	
	// Menu item routes
	api.HandleFunc("/menu-items", createMenuItem).Methods("POST")
	api.HandleFunc("/menu-items/{id:[0-9]+}", updateMenuItem).Methods("PATCH")
	api.HandleFunc("/menu-items/{id:[0-9]+}", deleteMenuItem).Methods("DELETE")
	
	// Order routes
	api.HandleFunc("/orders", createOrder).Methods("POST")
	api.HandleFunc("/orders/{id:[0-9]+}/status", updateOrderStatus).Methods("PATCH")
	api.HandleFunc("/orders/by-number/{orderNumber}", getOrderByNumber).Methods("GET")

	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
		AllowedHeaders: []string{"*"},
		AllowCredentials: true,
	})

	handler := c.Handler(router)
	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}

	fmt.Printf("Go server starting on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func initDB() {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	var err error
	db, err = gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	err = db.AutoMigrate(&Restaurant{}, &MenuCategory{}, &MenuItem{}, &Order{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	fmt.Println("Database connected and migrated successfully")
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	clients[conn] = true
	fmt.Println("WebSocket client connected")

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			delete(clients, conn)
			fmt.Println("WebSocket client disconnected")
			break
		}
	}
}

func handleMessages() {
	for {
		msg := <-broadcast
		for client := range clients {
			err := client.WriteMessage(websocket.TextMessage, msg)
			if err != nil {
				client.Close()
				delete(clients, client)
			}
		}
	}
}

func broadcastMessage(messageType string, data interface{}) {
	message := map[string]interface{}{
		"type": messageType,
		"data": data,
	}
	
	jsonData, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling broadcast message: %v", err)
		return
	}
	
	broadcast <- jsonData
}

func getRestaurants(w http.ResponseWriter, r *http.Request) {
	var restaurants []Restaurant
	if err := db.Find(&restaurants).Error; err != nil {
		http.Error(w, "Failed to fetch restaurants", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(restaurants)
}

func createRestaurant(w http.ResponseWriter, r *http.Request) {
	var restaurant Restaurant
	if err := json.NewDecoder(r.Body).Decode(&restaurant); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	restaurant.OrderModes = []string{"dine-in", "takeaway"}
	restaurant.TrialStartDate = time.Now()

	if err := db.Create(&restaurant).Error; err != nil {
		http.Error(w, "Failed to create restaurant", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(restaurant)
}

func getRestaurant(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid restaurant ID", http.StatusBadRequest)
		return
	}

	var restaurant Restaurant
	if err := db.First(&restaurant, id).Error; err != nil {
		http.Error(w, "Restaurant not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(restaurant)
}

func updateRestaurant(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid restaurant ID", http.StatusBadRequest)
		return
	}

	var updates map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var restaurant Restaurant
	if err := db.First(&restaurant, id).Error; err != nil {
		http.Error(w, "Restaurant not found", http.StatusNotFound)
		return
	}

	if err := db.Model(&restaurant).Updates(updates).Error; err != nil {
		http.Error(w, "Failed to update restaurant", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(restaurant)
}

func upgradeRestaurant(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid restaurant ID", http.StatusBadRequest)
		return
	}

	var request struct {
		PlanType string `json:"planType"`
	}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var restaurant Restaurant
	if err := db.First(&restaurant, id).Error; err != nil {
		http.Error(w, "Restaurant not found", http.StatusNotFound)
		return
	}

	subscriptionEndDate := time.Now().AddDate(0, 1, 0)
	
	updates := map[string]interface{}{
		"plan_type":            request.PlanType,
		"subscription_end_date": subscriptionEndDate,
		"is_active":           true,
	}

	if err := db.Model(&restaurant).Updates(updates).Error; err != nil {
		http.Error(w, "Failed to upgrade subscription", http.StatusInternalServerError)
		return
	}

	db.First(&restaurant, id)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(restaurant)
}

func getMenuCategories(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	restaurantID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid restaurant ID", http.StatusBadRequest)
		return
	}

	var categories []MenuCategory
	if err := db.Where("restaurant_id = ?", restaurantID).Order("display_order").Find(&categories).Error; err != nil {
		http.Error(w, "Failed to fetch categories", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(categories)
}

func getMenuItems(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	restaurantID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid restaurant ID", http.StatusBadRequest)
		return
	}

	var items []MenuItem
	query := db.Where("restaurant_id = ?", restaurantID)
	
	categoryID := r.URL.Query().Get("category")
	if categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}

	if err := query.Order("display_order").Find(&items).Error; err != nil {
		http.Error(w, "Failed to fetch menu items", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

func createMenuItem(w http.ResponseWriter, r *http.Request) {
	var item MenuItem
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := db.Create(&item).Error; err != nil {
		http.Error(w, "Failed to create menu item", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(item)
}

func updateMenuItem(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid menu item ID", http.StatusBadRequest)
		return
	}

	var updates map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var item MenuItem
	if err := db.First(&item, id).Error; err != nil {
		http.Error(w, "Menu item not found", http.StatusNotFound)
		return
	}

	if err := db.Model(&item).Updates(updates).Error; err != nil {
		http.Error(w, "Failed to update menu item", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(item)
}

func deleteMenuItem(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid menu item ID", http.StatusBadRequest)
		return
	}

	if err := db.Model(&MenuItem{}).Where("id = ?", id).Update("is_available", false).Error; err != nil {
		http.Error(w, "Failed to delete menu item", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Menu item deleted successfully"})
}

func getOrders(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	restaurantID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid restaurant ID", http.StatusBadRequest)
		return
	}

	var orders []Order
	query := db.Where("restaurant_id = ?", restaurantID)
	
	status := r.URL.Query().Get("status")
	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Order("created_at DESC").Find(&orders).Error; err != nil {
		http.Error(w, "Failed to fetch orders", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orders)
}

func createOrder(w http.ResponseWriter, r *http.Request) {
	var order Order
	if err := json.NewDecoder(r.Body).Decode(&order); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	order.OrderNumber = fmt.Sprintf("ORD-%d-%d", time.Now().Unix(), order.RestaurantID)

	if err := db.Create(&order).Error; err != nil {
		http.Error(w, "Failed to create order", http.StatusInternalServerError)
		return
	}

	broadcastMessage("newOrder", order)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(order)
}

func updateOrderStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid order ID", http.StatusBadRequest)
		return
	}

	var request struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var order Order
	if err := db.First(&order, id).Error; err != nil {
		http.Error(w, "Order not found", http.StatusNotFound)
		return
	}

	order.Status = request.Status
	order.UpdatedAt = time.Now()

	if err := db.Save(&order).Error; err != nil {
		http.Error(w, "Failed to update order status", http.StatusInternalServerError)
		return
	}

	broadcastMessage("orderStatusUpdate", order)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(order)
}

func getOrderByNumber(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	orderNumber := vars["orderNumber"]

	var order Order
	if err := db.Where("order_number = ?", orderNumber).First(&order).Error; err != nil {
		http.Error(w, "Order not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(order)
}

func getStats(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	restaurantID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid restaurant ID", http.StatusBadRequest)
		return
	}

	today := time.Now().Format("2006-01-02")
	var orders []Order
	db.Where("restaurant_id = ? AND DATE(created_at) = ?", restaurantID, today).Find(&orders)

	orderCount := len(orders)
	var revenue float64
	for _, order := range orders {
		if total, err := strconv.ParseFloat(order.Total, 64); err == nil {
			revenue += total
		}
	}

	itemCounts := make(map[string]int)
	for _, order := range orders {
		for _, item := range order.Items {
			itemCounts[item.Name] += item.Quantity
		}
	}

	popularItems := make([]map[string]interface{}, 0)
	for name, count := range itemCounts {
		popularItems = append(popularItems, map[string]interface{}{
			"name":  name,
			"count": count,
		})
	}

	stats := map[string]interface{}{
		"orderCount":    orderCount,
		"revenue":       revenue,
		"avgPrepTime":   12,
		"popularItems":  popularItems,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}