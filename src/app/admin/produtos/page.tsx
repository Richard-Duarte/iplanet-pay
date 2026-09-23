import { Package } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ProdutosAdminPanel } from "@/components/admin/produtos-admin-panel";
import { listAllProducts } from "@/lib/catalog/admin-products";
import { listCategoriesAdmin } from "@/lib/catalog/categories";

export const metadata = { title: "Produtos · Admin" };

export default async function AdminProdutosPage() {
  const [{ products, error: productsError }, { categories, error: catsError }] =
    await Promise.all([listAllProducts(), listCategoriesAdmin()]);

  const error = productsError ?? catsError;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Catálogo"
        title="Produtos"
        description="Cadastre produtos, categorias e abas dinâmicas da landing."
        size="lg"
      />

      {error ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="Não foi possível carregar"
          description={error}
        />
      ) : (
        <ProdutosAdminPanel products={products} categories={categories} />
      )}
    </div>
  );
}
