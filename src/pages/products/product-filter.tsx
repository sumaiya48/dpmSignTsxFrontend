import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { SetStateAction, useEffect, useState } from "react";
import { CategoryProps } from "@/hooks/use-category";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const ProductFilter = ({
	categories,
	selectedCategories,
	setSelectedCategories,
}: {
	categories: CategoryProps[];
	selectedCategories: CategoryProps[];
	setSelectedCategories: React.Dispatch<SetStateAction<CategoryProps[]>>;
}) => {
	const [checkedCategories, setCheckedCategories] = useState<number[]>([]);

	const [selectedCategory, setSelectedCategory] =
		useState<CategoryProps | null>(null);

	const handleSelectCategory = (category: CategoryProps) => {
		setSelectedCategory(category);

		// Add to selected categories array (for filtering)
		setSelectedCategories((prev) => {
			const isAlreadySelected = prev.some(
				(cat) => cat.categoryId === category.categoryId
			);

			if (isAlreadySelected) {
				// Remove if already selected
				return prev.filter((cat) => cat.categoryId !== category.categoryId);
			} else {
				// Add if not selected
				return [...prev, category];
			}
		});
	};

	const clearSelectedCategory = () => {
		setSelectedCategories([]);
		setSelectedCategory(null);
		setCheckedCategories([]);
	};

	return (
		<>
			<div className="flex items-start justify-center flex-col gap-4 pb-10">
				<div className="w-full">
					<h3 className="text-lg font-medium py-3">All Categories</h3>
					<Separator orientation="horizontal" />

					{/* Category */}

					<NestedCategoryAccordion
						categories={categories}
						checkedCategories={checkedCategories}
						setCheckedCategories={setCheckedCategories}
						onSelectCategory={handleSelectCategory}
						selectedCategoryId={selectedCategory?.categoryId}
					/>

					{selectedCategories && selectedCategories.length > 0 && (
						<div className="mt-4 pt-4 border-t border-gray-100">
							<h3 className="text-sm font-medium text-gray-500 mb-2">
								Selected Categories:
							</h3>
							<div className="flex flex-wrap gap-2">
								{selectedCategories.map((cat) => (
									<span
										key={cat.categoryId}
										className="text-sm bg-slate-100 px-2 py-1 rounded"
									>
										{cat.name}
									</span>
								))}
							</div>

							<div className="my-4">
								<Button
									size="xs"
									variant="destructive"
									onClick={clearSelectedCategory}
								>
									<X /> Clear
								</Button>
							</div>
						</div>
					)}
				</div>
			</div>
		</>
	);
};

interface CategoryTreeItem extends CategoryProps {
	children: CategoryTreeItem[];
}

const NestedCategoryAccordion = ({
	categories,
	checkedCategories,
	setCheckedCategories,
	onSelectCategory,
	selectedCategoryId,
}: {
	categories: CategoryProps[];
	checkedCategories: number[];
	setCheckedCategories: React.Dispatch<SetStateAction<number[]>>;
	onSelectCategory?: (category: CategoryProps) => void;
	selectedCategoryId?: number | null;
}) => {
	const [categoryTree, setCategoryTree] = useState<CategoryTreeItem[]>([]);
	const [expandedItems, setExpandedItems] = useState<string[]>([]);

	// Build the category tree on component mount or when categories change
	useEffect(() => {
		const buildCategoryTree = () => {
			// First identify all top-level categories (ones without parents or with parents not in our list)
			const topLevelCategories = categories.filter(
				(category) =>
					!category.parentCategoryId ||
					!categories.some((c) => c.categoryId === category.parentCategoryId)
			);

			// Function to recursively build the tree
			const buildTree = (category: CategoryProps): CategoryTreeItem => {
				const children = categories.filter(
					(c) => c.parentCategoryId === category.categoryId
				);

				return {
					...category,
					children: children.map(buildTree),
				};
			};

			// Build the complete tree
			const tree = topLevelCategories.map(buildTree);
			setCategoryTree(tree);

			// Auto-expand categories containing the selected category
			if (selectedCategoryId) {
				const pathToSelected = findPathToCategory(tree, selectedCategoryId);
				if (pathToSelected.length) {
					setExpandedItems(pathToSelected.map((id) => `category-${id}`));
				}
			}
		};

		buildCategoryTree();
	}, [categories, selectedCategoryId]);

	// Helper function to find the path to a selected category
	const findPathToCategory = (
		tree: CategoryTreeItem[],
		targetId: number,
		currentPath: number[] = []
	): number[] => {
		for (const node of tree) {
			// Check if this is the target
			if (node.categoryId === targetId) {
				return [...currentPath, node.categoryId];
			}

			// Check children
			if (node.children.length) {
				const path = findPathToCategory(node.children, targetId, [
					...currentPath,
					node.categoryId,
				]);
				if (path.length) return path;
			}
		}

		return [];
	};

	// Handle expanding/collapsing categories
	const handleValueChange = (value: string[]) => {
		setExpandedItems(value);
	};

	// Handle checkbox changes
	const handleCheckboxChange = (categoryId: number, checked: boolean) => {
		setCheckedCategories((prev) => {
			// if it has any subcategory then checked them too
			const selectedCategory = categories.find(
				(c) => categoryId === c.categoryId
			);
			if (checked) {
				if (
					selectedCategory?.subCategories &&
					!checkedCategories.includes(categoryId)
				) {
					return [
						...prev,
						categoryId,
						...selectedCategory.subCategories.map((sc) => sc.categoryId),
					];
				}

				return [...prev, categoryId];
			} else {
				const selectedCategorySubCategoryIds =
					selectedCategory?.subCategories.map((sc) => sc.categoryId);
				if (selectedCategory?.subCategories) {
					return prev
						.filter((id) => id !== categoryId)
						.filter((id) => !selectedCategorySubCategoryIds?.includes(id));
				}
				return prev.filter((id) => id !== categoryId);
			}
		});
		// todo: if all the subCategories are checked then check the parent category
		if (checked) {
			const selectedCategory = categories.find(
				(c) => categoryId === c.categoryId
			);
			console.log("selected category", selectedCategory);
			if (
				selectedCategory?.subCategories &&
				selectedCategory?.subCategories.length > 0
			) {
				for (const subCategory of selectedCategory.subCategories) {
					handleCheckboxChange(subCategory.categoryId, true);
				}
			}
		}

		// We can still use onSelectCategory to notify parent component about selection changes
		const selectedCategory = categories.find(
			(c) => c.categoryId === categoryId
		);
		const selectedSubCategory = categories.filter(
			(c) => c.parentCategoryId === categoryId
		);
		if (selectedCategory) {
			onSelectCategory?.(selectedCategory);
		}
		if (selectedSubCategory.length > 0) {
			for (const subCategory of selectedSubCategory) {
				onSelectCategory?.(subCategory);
			}
		}
	};

	// Render a category and its children recursively
	const renderCategory = (category: CategoryTreeItem, level: number = 0) => {
		const hasChildren = category.children.length > 0;
		const isSelected = selectedCategoryId === category.categoryId;
		const isChecked = checkedCategories.includes(category.categoryId);

		// Calculate indentation classes based on level
		// Using predefined classes for each level up to 5 levels deep
		const indentClasses = [
			"", // Level 0 - no indent
			"ml-4", // Level 1
			"ml-8", // Level 2
			"ml-12", // Level 3
			"ml-16", // Level 4
			"ml-20", // Level 5
		];

		const indentClass =
			level < indentClasses.length
				? indentClasses[level]
				: indentClasses[indentClasses.length - 1]; // Use the deepest indent for very deep nesting

		// For leaf nodes (no children), render a simple item with checkbox
		if (!hasChildren) {
			return (
				<div
					key={category.categoryId}
					className={cn(
						"flex items-center py-2 px-3 rounded-md transition-all",
						isSelected && "hover:text-skyblue",
						indentClass
					)}
				>
					<Checkbox
						id={`category-${category.categoryId}`}
						checked={isChecked}
						onCheckedChange={(checked) =>
							handleCheckboxChange(category.categoryId, checked === true)
						}
						className="mr-2 transition-all"
					/>
					<Label
						htmlFor={`category-${category.categoryId}`}
						className={cn(
							"text-sm font-medium cursor-pointer flex-grow transition-all",
							isSelected && "font-semibold"
						)}
					>
						{category.name}
						{category.products && (
							<span className="text-xs text-neutral-400 ml-1 transition-all">
								({category.products.length})
							</span>
						)}
					</Label>
				</div>
			);
		}

		// For categories with children, render as accordion
		return (
			<AccordionItem
				value={`category-${category.categoryId}`}
				key={category.categoryId}
				className="border-none"
			>
				<div className={cn("flex items-center", indentClass)}>
					{/* <Checkbox
						id={`category-${category.categoryId}`}
						checked={isChecked}
						onCheckedChange={(checked) =>
							handleCheckboxChange(category.categoryId, checked === true)
						}
						className="mr-2 ml-2 transition-all"
					/> */}
					<AccordionTrigger
						className={cn(
							"py-2 pr-2 rounded-md transition-all flex items-center flex-grow",
							"data-[state=open]:text-skyblue",
							isSelected && "hover:text-skyblue"
						)}
					>
						<div className="flex items-center w-full">
							<Label
								htmlFor={`category-${category.categoryId}`}
								className={cn(
									"text-sm font-medium cursor-pointer transition-all",
									isSelected && "font-semibold"
								)}
								onClick={(e) => e.stopPropagation()} // Prevent accordion toggle when clicking label
							>
								{category.name}
							</Label>
							{category.products && (
								<span className="text-xs text-neutral-400 ml-1 mr-2 transition-all">
									({category.products.length})
								</span>
							)}
						</div>
					</AccordionTrigger>
				</div>

				<AccordionContent className="pt-1 pb-0">
					<div className="transition-all">
						{category.children.map((child) => renderCategory(child, level + 1))}
					</div>
				</AccordionContent>
			</AccordionItem>
		);
	};

	return (
		<div className="w-full category-accordion overflow-hidden">
			<Accordion
				type="multiple"
				value={expandedItems}
				onValueChange={handleValueChange}
				className="w-full transition-all"
			>
				{categoryTree.map((category) => renderCategory(category))}
			</Accordion>
		</div>
	);
};

export default ProductFilter;
