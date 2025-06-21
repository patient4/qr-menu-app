import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { MenuItem } from "@shared/schema";

interface MenuCardProps {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export default function MenuCard({ item, quantity, onAdd, onRemove }: MenuCardProps) {
  return (
    <Card className="overflow-hidden animate-fade-in">
      <CardContent className="p-0">
        <div className="flex">
          <img
            src={item.imageUrl || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"}
            alt={item.name}
            className="w-24 h-24 object-cover rounded-l-xl"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200";
            }}
          />
          <div className="flex-1 p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-dark">{item.name}</h3>
              <div className="flex items-center">
                <span className="text-green-600 text-xs mr-1">●</span>
                <span className="text-xs text-muted-foreground">
                  {item.isVeg ? "Veg" : "Non-Veg"}
                </span>
                {item.isPopular && (
                  <Badge className="bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full ml-2">
                    Popular
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
              {item.description}
            </p>
            <div className="flex justify-between items-center">
              <span className="font-bold text-primary">
                {formatCurrency(item.price)}
              </span>
              {quantity === 0 ? (
                <Button
                  size="sm"
                  className="gradient-primary font-medium"
                  onClick={onAdd}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-8 h-8 rounded-full p-0"
                    onClick={onRemove}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="font-semibold text-primary min-w-[1.5rem] text-center">
                    {quantity}
                  </span>
                  <Button
                    size="sm"
                    className="gradient-primary w-8 h-8 rounded-full p-0"
                    onClick={onAdd}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
