import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import AvatarImg from "@/assets/images/avatar.png";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router-dom";
import routes from "@/routes";
import { useFormValidation } from "@/hooks/use-form-validation";
import { productReviewService } from "@/api";
import { Textarea } from "@/components/ui/textarea";
import { useDisclosure } from "@mantine/hooks";
import { useToast } from "@/hooks/use-toast";
import { LoadingOverlay } from "@mantine/core";
import { ProductReviewProps } from "@/hooks/use-product";

interface ReviewFormProps {
	name: string;
	email: string;
	rating: number;
	description: string;
}

const ProductReview = ({
	productId,
	reviews,
}: {
	productId: number;
	reviews: ProductReviewProps[];
}) => {
	const [loading, setLoading] = useDisclosure();
	const { toast } = useToast();
	const { token, customer } = useAuth();
	const [reviewFormData, setReviewFormData] = useState<ReviewFormProps>({
		name: customer?.name || "",
		email: customer?.email || "",
		description: "",
		rating: 0,
	});

	const { errors, validateField } = useFormValidation(
		productReviewService.reviewCreationSchema
	);

	// Handle form input changes
	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;

		validateField(name, value);
		setReviewFormData({ ...reviewFormData, [name]: value });
	};

	// Handle rating change
	const handleRating = (ratingValue: number) => {
		setReviewFormData({ ...reviewFormData, rating: ratingValue });
	};

	// Submit form
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			if (reviewFormData.rating === 0) {
				toast({
					description: "Please select a rating.",
					variant: "destructive",
					duration: 10000,
				});
				return;
			}
			if (validateField("description", reviewFormData.description)) {
				setLoading.open();

				if (!token || !customer) {
					toast({
						description: "Please login to post a review.",
						variant: "destructive",
						duration: 10000,
					});
					return;
				}

				const response = await productReviewService.createReview(
					token,
					reviewFormData.rating,
					reviewFormData.description,
					productId,
					customer?.customerId
				);

				toast({
					description: response.message,
					variant: response.status === 200 ? "success" : "default",
					duration: 10000,
				});

				setReviewFormData({
					...reviewFormData,
					description: "",
					rating: 0,
				});
			}
		} catch (err: any) {
			setLoading.close();
			console.log(err.message);
			toast({
				description: err.message,
				variant: "destructive",
				duration: 10000,
			});
		} finally {
			setLoading.close();
		}
	};

	return (
		<div className="max-w-full py-5 space-y-8">
			{/* Previous Reviews */}
			<div>
				<h2 className="text-xl xl:text-2xl font-medium xl:font-semibold mb-4">
					Customer Reviews
				</h2>
				{reviews.filter((review) => review.status === "published").length > 0 &&
					reviews
						.filter((review) => review.status === "published")
						.map((review) => (
							<div
								key={review.reviewId}
								className="border-b border-gray/60 pb-4 mb-4"
							>
								<div className="flex items-start justify-between gap-4">
									<Avatar>
										<AvatarImage src={AvatarImg} />
										<AvatarFallback>{review.customer.name}</AvatarFallback>
									</Avatar>
									<div className="w-full flex items-start justify-start gap-2 flex-col">
										<span className="text-base xl:text-lg font-medium xl:font-semibold">
											{review.customer.name}
										</span>
										<div className="flex text-yellow">
											{Array.from({
												length: 5,
											}).map((_, index) => (
												<Star
													key={index}
													size={15}
													className={
														index < review.rating
															? "fill-current"
															: "text-gray-300"
													}
												/>
											))}
										</div>
										<p className="text-gray-600 text-sm lg:text-base font-medium">
											{review.description}
										</p>
									</div>
								</div>
							</div>
						))}

				{reviews.length === 0 && (
					<div className="w-full">
						<p className="text-sm font-semibold text-gray">
							Be the first to review this product.
						</p>
					</div>
				)}
			</div>

			{/* Review Form */}
			{token ? (
				<div className="bg-gray-100 py-6 rounded-md">
					{loading && (
						<>
							<LoadingOverlay
								visible={loading}
								zIndex={10}
								overlayProps={{ radius: "xs", blur: 1 }}
							/>
						</>
					)}

					<h3 className="text-xl font-semibold mb-4">Write a Review</h3>
					<form onSubmit={handleSubmit} className="space-y-4">
						{/* Name */}
						<div className="w-full space-y-2">
							<Label
								htmlFor="name"
								className="text-base lg:text-lg cursor-pointer"
							>
								Name
								<span className="text-skyblue"> *</span>
							</Label>
							<Input
								type="text"
								id="name"
								name="name"
								readOnly={customer?.name ? true : false}
								value={reviewFormData.name}
								onChange={handleChange}
							/>
						</div>

						{/* Email */}
						<div className="w-full space-y-2">
							<Label
								htmlFor="email"
								className="text-base lg:text-lg cursor-pointer"
							>
								Email
								<span className="text-skyblue"> *</span>
							</Label>
							<Input
								type="email"
								id="email"
								name="email"
								readOnly={customer?.email ? true : false}
								value={reviewFormData.email}
								onChange={handleChange}
							/>
						</div>

						{/* Rating */}
						<div className="w-full space-y-2">
							<Label className="text-base lg:text-lg cursor-pointer">
								Rating
								<span className="text-skyblue"> *</span>
							</Label>

							<div className="flex gap-2">
								{Array.from({ length: 5 }).map((_, index) => (
									<Star
										key={index}
										size={24}
										className={cn(
											"cursor-pointer",
											index < reviewFormData.rating
												? "text-yellow fill-current"
												: "text-gray"
										)}
										onClick={() => handleRating(index + 1)}
									/>
								))}
							</div>
						</div>

						{/* Review Text */}
						<div className="form-group flex-col items-start">
							<Label
								htmlFor="description"
								className="text-base lg:text-lg cursor-pointer"
							>
								Review
								<span className="text-skyblue"> *</span>
							</Label>
							<Textarea
								id="description"
								name="description"
								rows={5}
								placeholder="your review here..."
								value={reviewFormData.description}
								onChange={handleChange}
								className={cn(
									errors.description && "border-rose-500 hover:border-rose-500"
								)}
								error={errors.description ? true : false}
							></Textarea>

							{errors.description && (
								<p className="text-rose-500 font-semibold text-sm">
									{errors.description}
								</p>
							)}
						</div>

						{/* Submit Button */}
						<Button type="submit">Submit Review</Button>
					</form>
				</div>
			) : (
				<div className="w-full">
					<p className="text-base font-semibold">
						Please{" "}
						<Link to={routes.account.path} className="text-skyblue underline">
							login
						</Link>{" "}
						to give a review on this product.
					</p>
				</div>
			)}
		</div>
	);
};

export default ProductReview;
